from celery import shared_task
from celery import group
from api_projects.models import (
    Project, 
    ProjectInstallationCrew,
    ProjectDefaultGuideProduct,
    ProjectDefaultMaterial,
    ProjectDefaultTask,
)

from api_projects.repository import (
    project_profit_report_repository as profit_repo,
    project_notification_repository as notification_repo,
    project_tracking_repository as tracking_repo,
    project_reminder_repository as reminder_repo,
    project_task_attachment_repository as attachment_repo,
    project_db_repository as db_repo,
    project_work_orders_repository as work_order_repo,
    project_installation_guide_repository as installation_guide_repo,
)

from api_projects.data_util import get_user_role_name, transform_data_to_mongo
from django.utils import timezone

import logging
from bson import ObjectId

logger = logging.getLogger(__name__)
    
@shared_task
def task_delete_old_notifications():
    notification_repo.delete_old_notifications()
    
@shared_task
def task_delete_old_trackings():
    tracking_repo.delete_old_trackings()
    
@shared_task
def task_delete_old_reminders():
    reminder_repo.delete_old_reminders()
    

@shared_task
def task_redefine_project_task_attachments():
    logger.info("Starting task to redefine project task attachments...")
    try:
        attachment_repo.redefine_project_task_attachments()
        logger.info("Redefinition of project task attachments completed successfully.")
    except Exception as e:
        logger.error("Error during redefinition of project task attachments: %s", str(e))
        raise e
    
@shared_task
def task_generate_db_backup():
    logger.info("Starting MongoDB backup task...")
    result = db_repo.generate_db_backup()
    logger.info("Backup task result: %s", result)
    return result

@shared_task
def task_manage_profit_single_report(project_id: str, force_update: bool = False):
  logger.info("Starting task to manage profit report for project ID: %s", project_id)
  try:
      response = profit_repo.manage_profit_report(project_id, force_update=force_update)
      logger.info(
          "Profit report done for %s | status=%s",
          project_id,
          getattr(response, "status", None)
      )
      return getattr(response, "data", None)
  except Exception as e:
      logger.error("Error managing profit report for project ID %s: %s", project_id, str(e))
      raise

BATCH_SIZE = 200  # ajusta a tu realidad

@shared_task
def task_manage_profit_report(force_update: bool = False):
    logger.info("Starting task to manage project profit reports...")
    
    projects_qs = Project.objects.only('id')
    total = projects_qs.count()
    logger.info("Found %s projects to process", total)

    batch_size = BATCH_SIZE
    current_batch = []
    batches = 0

    for project in projects_qs:
        current_batch.append(
            task_manage_profit_single_report.s(str(project.id), force_update=force_update)
        )

        if len(current_batch) >= batch_size:
            group(current_batch).apply_async()
            batches += 1
            current_batch = []
    
    if current_batch:
        group(current_batch).apply_async()
        batches += 1

    logger.info(
        "Dispatched profit report tasks: total=%s | batches=%s | batch_size=%s",
        total, batches, batch_size
    )

    return {"scheduled": total, "batches": batches, "batch_size": batch_size}


MOCK_WORK_TYPES = [
    { 'id': 1, 'name': 'Installation' },
    { 'id': 2, 'name': 'Finish' },
    { 'id': 3, 'name': 'Inspection' },
    { 'id': 4, 'name': 'Service' },
]

MOCK_INSPECTION_TYPES = [
    { 'id': 1, 'name': 'Book and Fasteners' },
    { 'id': 2, 'name': 'Final' },
]



@shared_task
def task_manage_single_project_work_orders(project_id: str, work_type: str = None, inspection_type: str = None):
    logger.info("Starting task to manage work orders for project ID: %s", project_id)
    try:
        project = Project.objects(id=project_id).first()
        if not project:
            logger.warning("Project with ID %s not found.", project_id)
            return None
        start_date_fmt = ''
        duration = 0
        start_date = None
        type_date = ''
        
        if work_type.lower() == 'installation':
            type_date = 'installation date'
            if project.start_date:
                start_date_fmt = project.start_date.strftime('%Y-%m-%d')
                start_date = project.start_date
                duration = project.duration or 1
        elif work_type.lower() == 'inspection' and inspection_type.lower() == 'book and fasteners':
            type_date = 'inspection date'
            if project.inspection_date:
                start_date_fmt = project.inspection_date.strftime('%Y-%m-%d')
                start_date = project.inspection_date
                duration = project.inspection_duration or 1
            
        elif work_type.lower() == 'inspection' and inspection_type.lower() == 'final':
            type_date = 'final inspection date'
            if project.finish_permission_date:
                start_date_fmt = project.finish_permission_date.strftime('%Y-%m-%d')
                start_date = project.finish_permission_date
                duration = project.finish_permission_duration or 1
            
            
        if not start_date_fmt:
            logger.warning("Project with ID %s has no %s. Skipping work order creation.", project_id, type_date)
            return None
        
        user_reporter = project.user_reporter
        title = work_type if work_type.lower() != 'inspection' else f"inspection ({inspection_type.upper() or ''})"
        name = f"WO for {title or ''} in {project.name}, date: {start_date_fmt}"
        
        existing_work_order = None

        if work_type and project.work_orders:
            wt = work_type.lower()
            it = (inspection_type or '').lower()
            
            if wt == 'inspection' and it in ['book and fasteners', 'final']:
                existing_work_order = next(
                    (
                        wo for wo in project.work_orders
                        if (wo.get('work_type') or {}).get('name', '').lower() == wt
                        and (wo.get('inspection_type') or {}).get('name', '').lower() == it
                    ),
                    None
                )
            else:
                existing_work_order = next(
                    (
                        wo for wo in project.work_orders
                        if (wo.get('work_type') or {}).get('name', '').lower() == wt
                    ),
                    None
                )
        
        if existing_work_order:
            logger.info(
                "Work order already exists for project ID %s with work type %s. Skipping creation.",
                project_id,
                work_type
            )
            return getattr(project, "name", None)
        
        description = f"Automated task to manage {work_type or ''} work orders for project."
        
        
        if project.user_installer and (work_type.lower() == 'installation' or work_type.lower() == 'service'):
            users_assignees = [project.user_installer]
        elif project.users_assignees and (work_type.lower() == 'installation' or work_type.lower() == 'service'):
            first_installer = next(
                (user for user in project.users_assignees if get_user_role_name(user) == 'installer'),
                None
            )
            users_assignees = [first_installer] if first_installer else [project.users_assignees[0]]
        else:
            users_assignees = [project.user_manager]
            
        items = [
            item for item in project.sales_order.get('line_items', []) if item.get('line_item_type', '') == 'goods'
        ] if project.sales_order and work_type.lower() == 'installation' else []
        is_finished = False
        
        work_type = next(
            (wt for wt in MOCK_WORK_TYPES if wt['name'].lower() == work_type.lower()),
            None
        ) if work_type else None
        
        inspection_type = next(
            (it for it in MOCK_INSPECTION_TYPES if it['name'].lower() == inspection_type.lower()),
            None
        ) if inspection_type else None
        
        crews = list(ProjectInstallationCrew.objects.all())
        installer_crews = []
        
        if project.user_installer and project.user_installer.get('username') == 'glauver':
            installer_crews = [
                transform_data_to_mongo(crew) for crew in crews 
                if 'glauver' in [member.get('username', '').lower() for member in crew.users_installers]
            ]
        
        elif project.user_installer and project.user_installer.get('username') == 'carlos.garma':
            installer_crews = [
                transform_data_to_mongo(crew) for crew in crews 
                if 'carlos.garma' in [member.get('username', '').lower() for member in crew.users_installers]
                and 'team carlos - father' in crew.name.lower()
            ]
        
        proj, work_order, action = work_order_repo.manage_project_work_order_from_kwargs(
            project_id=project_id,
            user_reporter=user_reporter,
            name=name,
            description=description,
            start_date=start_date,
            duration=duration,
            users_assignees=users_assignees if len(installer_crews) == 0 else [],
            work_type=work_type,
            inspection_type=inspection_type,
            items=items,
            is_finished=is_finished,
            installer_crews=installer_crews if len(installer_crews) > 0 else [],
        )
        
        logger.info(
            "Work orders management done for project %s | id=%s",
            proj.name,
            getattr(proj, "id", None)
        )
        return getattr(proj, "name", None)
    except Exception as e:
        logger.error("Error managing work orders for project ID %s: %s", project_id, str(e))
        raise
    
WORK_ORDER_SPECS = (
    {"work_type": "installation"},
    {"work_type": "inspection", "inspection_type": "book and fasteners"},
    {"work_type": "inspection", "inspection_type": "final"},
)

TASKS_PER_PROJECT = len(WORK_ORDER_SPECS)


@shared_task
def task_manage_work_orders_in_batches():
    logger.info("Starting task to manage project work orders in batches...")
    
    projects_qs = Project.objects.only("id")

    batch_size = BATCH_SIZE  
    current_batch = []
    batches = 0
    total_projects = 0
    total_tasks = 0
    
    single_task_sig = task_manage_single_project_work_orders.s

    for project in projects_qs:
        total_projects += 1
        project_id = str(project.id)
        
        for spec in WORK_ORDER_SPECS:
            current_batch.append(single_task_sig(project_id, **spec))

        total_tasks += TASKS_PER_PROJECT
        
        if len(current_batch) >= batch_size:
            group(current_batch).apply_async(ignore_result=True)
            batches += 1
            current_batch = []
    
    if current_batch:
        group(current_batch).apply_async(ignore_result=True)
        batches += 1

    logger.info(
        "Dispatched work order tasks | projects=%s | tasks=%s | batches=%s | batch_size=%s",
        total_projects,
        total_tasks,
        batches,
        batch_size,
    )

    return {
        "projects": total_projects,
        "tasks": total_tasks,
        "batches": batches,
        "batch_size": batch_size,
    }
    

##############################################
# CREATE PROJECT INSTALLATION CREW
##############################################

@shared_task
def task_update_installation_crews_in_projects(crew_id: str):
    logger.info("Starting task to update installation crew ID: %s in projects...", crew_id)
    try:
        crew = ProjectInstallationCrew.objects(id=crew_id).first()
        if not crew:
            logger.warning("Installation crew with ID %s not found.", crew_id)
            return None
        
        projects_qs = (
            Project.objects(
                __raw__={"work_orders.installer_crews.id": crew_id}
            )
            .only('id', 'work_orders')
        )
        
        updated_projects = []
        
        for project in projects_qs:
            changed = False

            for work_order in project.work_orders or []:
                installer_crews = work_order.get('installer_crews', []) or []
                for idx, ic in enumerate(installer_crews):
                    if str(ic.get('id')) == str(crew_id):
                        installer_crews[idx] = transform_data_to_mongo(crew)
                        changed = True
                work_order['installer_crews'] = installer_crews

            if changed:
                project.save(validate=False)
                task_manage_profit_single_report.delay(str(project.id), force_update=True)
                updated_projects.append(str(project.id))
        
        logger.info(
            "Updated installation crew ID %s in %s projects.",
            crew_id,
            len(updated_projects)
        )
        return updated_projects
    except Exception as e:
        logger.error("Error updating installation crew ID %s in projects: %s", crew_id, str(e))
        raise
    
@shared_task
def task_rebuild_scope_and_materials_in_project(project_id: str):
    logger.info("Starting task to rebuild scope and materials for project ID: %s", project_id)
    try:
        project = Project.objects(id=project_id).first()
        if not project:
            logger.warning("Project with ID %s not found.", project_id)
            return None

        loaded_default_guide_products = list(
            ProjectDefaultGuideProduct.objects.all().as_pymongo()
        )
        loaded_default_materials = list(
            ProjectDefaultMaterial.objects.all().as_pymongo()
        )

        sales_order = getattr(project, "sales_order", None) or {}
        list_items = sales_order.get("line_items", []) or []

        logger.info(
            "Processing project ID %s with %d line_items.",
            str(project.id),
            len(list_items),
        )

        # Solo goods
        list_items = [
            item for item in list_items
            if ((item.get("line_item_type") or "").lower() == "goods" or 
               (item.get("product_type") or "").lower() == "goods")
        ]

        if not list_items:
            logger.info("No goods line items found for project ID %s. Skipping.", project_id)
            return None

        # ---------- 1) productsData ----------
        products_data = []
        if not project.project_guide_products or len(project.project_guide_products) == 0:
            products_data = installation_guide_repo.compute_products_data_for_project(
                project=project,
                list_items=list_items,
                loaded_default_guide_products=loaded_default_guide_products,
            )

        if (
            (not project.project_guide_products or len(project.project_guide_products) == 0)
            and len(products_data) > 0
        ):
            project.project_guide_products = products_data
            project.save(validate=False)

        # ---------- 2) materials ----------
        materials = []
        if not project.project_materials or len(project.project_materials) == 0:
            materials = installation_guide_repo.compute_materials_for_project(
                project=project,
                products_data=products_data,
                loaded_default_materials=loaded_default_materials,
            )

        if (
            (not project.project_materials or len(project.project_materials) == 0)
            and len(materials) > 0
        ):
            project.project_materials = materials
            project.save(validate=False)

        logger.info(
            "Updated project ID %s with new scope and materials.",
            str(project.id),
        )
        return str(project.id)
    except Exception as e:
        logger.error("Error rebuilding scope and materials for project ID %s: %s", project_id, str(e))
        raise
    

@shared_task
def task_rebuild_scope_and_materials(batch_size: int = 200):
    """
    Recorre todos los Project en batches, recalcula productsData (scope)
    y projectMaterials según los defaults.
    """
    logger.info("Starting task to rebuild scope and materials for projects...")

    loaded_default_guide_products = list(
        ProjectDefaultGuideProduct.objects.all().as_pymongo()
    )
    loaded_default_materials = list(
        ProjectDefaultMaterial.objects.all().as_pymongo()
    )

    updated = 0
    errors = []

    # Query base ordenado por id (importante para que skip/limit sea estable)
    base_qs = Project.objects.only(
        "id",
        "project_guide_products",
        "project_materials",
        "sales_order",
    ).order_by("id")

    total = base_qs.count()
    logger.info("Total projects to rebuild: %s", total)

    offset = 0
    while offset < total:
        logger.info("Processing batch offset %s / %s (batch_size=%s)",
                    offset, total, batch_size)

        # Batch actual
        batch_qs = base_qs.skip(offset).limit(batch_size)

        for project in batch_qs:
            try:
                sales_order = getattr(project, "sales_order", None) or {}
                list_items = sales_order.get("line_items", []) or []

                logger.info(
                    "Processing project ID %s with %d line_items.",
                    str(project.id),
                    len(list_items),
                )

                # Solo goods
                list_items = [
                    item for item in list_items
                    if ((item.get("line_item_type") or "").lower() == "goods" or 
                       (item.get("product_type") or "").lower() == "goods")
                ]

                if not list_items:
                    continue

                # ---------- 1) productsData ----------
                products_data = []
                if not project.project_guide_products or len(project.project_guide_products) == 0:
                    products_data = installation_guide_repo.compute_products_data_for_project(
                        project=project,
                        list_items=list_items,
                        loaded_default_guide_products=loaded_default_guide_products,
                    )

                if (
                    (not project.project_guide_products or len(project.project_guide_products) == 0)
                    and len(products_data) > 0
                ):
                    project.project_guide_products = products_data
                    project.save(validate=False)

                # ---------- 2) materials ----------
                materials = []
                if not project.project_materials or len(project.project_materials) == 0:
                    materials = installation_guide_repo.compute_materials_for_project(
                        project=project,
                        products_data=products_data,
                        loaded_default_materials=loaded_default_materials,
                    )

                if (
                    (not project.project_materials or len(project.project_materials) == 0)
                    and len(materials) > 0
                ):
                    project.project_materials = materials
                    project.save(validate=False)

                updated += 1
                logger.info(
                    "Updated project ID %s with new scope and materials.",
                    str(project.id),
                )

            except Exception as exc:
                logger.error(
                    "Error processing project ID %s: %s",
                    str(project.id),
                    str(exc),
                    exc_info=True,
                )
                errors.append({"project_id": str(project.id), "error": str(exc)})

        offset += batch_size
        logger.info(
            "Rebuild progress: %s projects updated, %s errors so far. offset=%s",
            updated,
            len(errors),
            offset,
        )

    return {"updated": updated, "errors": errors}


@shared_task
def task_update_default_task_in_projects(default_task_id: str):
    logger.info("Starting task to update default task ID: %s in projects...", default_task_id)
    default_task = ProjectDefaultTask.objects(id=default_task_id).first()
    
    projects = Project.objects.all()
    for project in projects:
        project_default_tasks = project.project_default_tasks if project.project_default_tasks else []
        task = next((task for task in project_default_tasks if str(task['project_default_task']['_id']) == default_task_id), None)
        project_default_tasks = [task for task in project_default_tasks if str(task['project_default_task']['_id']) != default_task_id]
        project_default_tasks.append({
            'project_default_task': transform_data_to_mongo(default_task, exclude_fields=['last_modified_time']),
            'status': task['status'] if task else 'not started',
            'percentage': task['percentage'] if task else 0,
            'created_time': task['created_time'] if task else timezone.now(),
            # 'last_modified_time': timezone.now(),
            'users_assignees': task['users_assignees'] if task else [],
            'priority': task['priority'] if task else 'medium',
            'project_task_attachments': task['project_task_attachments'] if task else [],
        })
        project_default_tasks = sorted(project_default_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
        project.project_default_tasks = project_default_tasks
        
        project_default_tasks = project.project_default_tasks if project.project_default_tasks else []
        for task in project_default_tasks:
            new_task = ProjectDefaultTask.objects(id=task['project_default_task']['_id']).first()
            task['project_default_task'] = transform_data_to_mongo(new_task)
        project_default_tasks = sorted(project_default_tasks, key=lambda x: x['project_default_task']['order'], reverse=True)
        project.project_default_tasks = project_default_tasks
        project.save(validate=False)