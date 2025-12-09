from datetime import timezone
from api_projects.models import ProjectProfitReport, Project, ProjectTracking
from api_projects.data_util import create_notification, transform_data_to_mongo
from rest_framework.response import Response
from django.utils import timezone
from decimal import Decimal, InvalidOperation

from decimal import Decimal, InvalidOperation

from django.utils import timezone
from rest_framework.response import Response

from api_projects.models import Project, ProjectProfitReport
from api_projects.repository.project_profit_report_repository import transform_data_to_mongo  # ajusta import

import json
import logging

logger = logging.getLogger(__name__)

# ----------------------------------------------------------------------
# Helper seguro para convertir a Decimal
# ----------------------------------------------------------------------
def to_decimal(value, default=Decimal("0")) -> Decimal:
    """
    Convierte value a Decimal de forma segura.
    - Si es None, '', o no convertible -> devuelve default (0).
    - Acepta int, float, str con números, etc.
    """
    if value is None:
        return default
    try:
        # Usamos str() para evitar problemas con tipos raros
        text = str(value).strip()
        if text == "":
            return default
        return Decimal(text)
    except (InvalidOperation, TypeError, ValueError):
        return default
    
    
def get_nested(obj, *keys):
    """
    Navega por obj usando keys, soportando:
    - dicts con snake_case y camelCase
    - listas (intenta cada elemento hasta encontrar un valor no None)
    """

    def _to_camel(snake: str) -> str:
        parts = snake.split('_')
        return parts[0].lower() + ''.join(p.title() for p in parts[1:])

    def _walk(current, idx: int):
        if current is None:
            return None

        # ya consumimos todas las keys -> devolver lo que haya
        if idx >= len(keys):
            return current

        key = keys[idx]

        # Si es lista: probamos cada elemento con la MISMA key (no se incrementa idx aquí)
        if isinstance(current, list):
            for elem in current:
                val = _walk(elem, idx)
                if val is not None:
                    return val
            return None

        # Si es dict: probamos snake y camel, y avanzamos al siguiente índice
        if isinstance(current, dict):
            snake = key
            camel = _to_camel(snake)

            if snake in current:
                return _walk(current[snake], idx + 1)
            if camel in current:
                return _walk(current[camel], idx + 1)
            return None

        # Cualquier otro tipo -> no se puede seguir navegando
        return None

    return _walk(obj, 0)



def safe_to_decimal(value, default="0"):
    """
    Convierte a Decimal de forma segura.
    Acepta int, float, str, None. Si falla, devuelve default.
    """
    if value is None:
        return Decimal(default)
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return Decimal(default)


def get_cost_by_unit_for_wo(wo: dict) -> Decimal:
    """
    Busca cost_by_unit primero en installer_crews, luego en users_assignees.installer_info.
    Soporta snake/camel por get_nested y devuelve siempre Decimal.
    """
    cost_installer = get_nested(wo, "installer_crews", "cost_by_unit")
    cost_assignee = get_nested(wo, "users_assignees", "installer_info", "cost_by_unit")

    cost = cost_installer if cost_installer is not None else cost_assignee
    return safe_to_decimal(cost, default="0")


# ----------------------------------------------------------------------
# Lógica principal
# ----------------------------------------------------------------------
def manage_profit_report(project_id: str, force_update=False) -> Response:
    project = Project.objects(id=project_id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=400)
    
    work_orders = getattr(project, "work_orders", []) or []
    install_work_orders = [wo for wo in work_orders if wo.get("work_type", {}).get("name", "").lower() == "installation"]
    logger.info(f"Found {len(install_work_orders)} installation work orders for project {project.name}")
    
    def is_on_subcontractor_crew(wo):
        name1 = (get_nested(wo, "installer_crews", "type_crew", "value") or "").lower()
        name2 = (get_nested(wo, "users_assignees", "installer_info", "type_crew", "value") or "").lower()
        logger.info(f"Work order {wo.get('id', '')}: crew types '{name1}', '{name2}'")
        return name1 == "subcontractor" or name2 == "subcontractor"
    
    is_on_subcontractor = any(is_on_subcontractor_crew(wo) for wo in install_work_orders)
    
    sum_cost_work_orders = sum(
        safe_to_decimal(wo.get("duration", 0), default="0")
        * get_cost_by_unit_for_wo(wo)
        for wo in install_work_orders
    )
    
     # Verificar si ya existe un reporte no editado

    project_profit = ProjectProfitReport.objects(project_id=str(project.id), has_been_edited=False).first()
    if project_profit and not force_update:
        return Response(
            {'message': f'Project profit report for {project.name} already exists'},
            status=200
        )

    # ---- Sales order / line items ----
    sales_order = getattr(project, "sales_order", None) or {}
    line_items = sales_order.get("line_items", []) or []

    # Total items (solo goods)
    total_items = sum(
        to_decimal(item.get("item_total"))
        for item in line_items
        if "good" in (item.get("line_item_type", "") or "").lower()
    )

    # Total instalación (nombre contiene install o struct)
    total_installation = sum(
        to_decimal(item.get("item_total"))
        for item in line_items
        if (
            "install" in (item.get("name", "") or "").lower()
            or "struct" in (item.get("name", "") or "").lower()
        )
    )

    # Total others (ni good, ni install, ni struct)
    total_others = sum(
        to_decimal(item.get("item_total"))
        for item in line_items
        if (
            "good" not in (item.get("line_item_type", "") or "").lower()
            and "install" not in (item.get("name", "") or "").lower()
            and "struct" not in (item.get("name", "") or "").lower()
        )
    )

    # Totales de la sales order
    total_sales_order = to_decimal(sales_order.get("total"))
    subtotal_sales_order = to_decimal(sales_order.get("sub_total"))
    tax_total_sales_order = to_decimal(sales_order.get("tax_total"))

    # ---- Subcontratistas / materiales ----
    guide_products = getattr(project, "project_guide_products", None) or []
    materials = getattr(project, "project_materials", None) or []

    total_subcontractor = sum(
        to_decimal(item.get("quantity")) * to_decimal(item.get("price"))
        for item in guide_products
        if not item.get("deleted", False)
    )

    total_materials = sum(
        to_decimal(item.get("quantity")) * to_decimal(item.get("cost"))
        for item in materials
    )

    total_installing = total_subcontractor + total_materials

    # Profit = instalación facturada - costo instalación
    total_profit = total_installation - total_installing
    
    total_profit_onhouse = total_installation - sum_cost_work_orders

    # ---- Info del proyecto ----
    project_info = transform_data_to_mongo(
        project,
        include_fields=["id", "name", "number"],
    )
    
    project_info["install_work_orders"] = install_work_orders
    project_info["duration"] = sum(
        int(wo.get("duration", 0))
        for wo in install_work_orders
    )
    
    project_amount_f = float(total_sales_order or 0)
    installation_amount_f = float(total_installation or 0)
    installation_cost_f = float(total_installing or 0)
    installation_profit_f = float(total_profit or 0)
    
    installation_cost_onhouse_f = float(sum_cost_work_orders or 0)
    installation_profit_onhouse_f = float(total_profit_onhouse or 0)
    

    if force_update and project_profit:
        project_profit.project_info = project_info
        project_profit.project_amount = project_amount_f
        project_profit.installation_amount = installation_amount_f
        project_profit.installation_cost_subcontractor = installation_cost_f
        project_profit.installation_profit_subcontractor = installation_profit_f
        project_profit.installation_cost_onhouse = installation_cost_onhouse_f
        project_profit.installation_profit_onhouse = installation_profit_onhouse_f
        project_profit.working_type = "subcontractor" if is_on_subcontractor else "onhouse"
        project_profit.last_modified_time = timezone.now()
        project_profit.save()

        return Response(
            {'message': f'Project profit report for {project.name} updated successfully'},
            status=200
        )
        
    elif not project_profit:

        project_profit = ProjectProfitReport(
            project_id=str(project.id),
            project_info=project_info,
            project_amount=total_sales_order,      # monto total del proyecto
            installation_amount=total_installation,  # lo que cobras por instalar
            installation_cost_subcontractor=total_installing,      # lo que te cuesta instalar
            installation_profit_subcontractor=total_profit,        # utilidad
            installation_cost_onhouse=sum_cost_work_orders,
            installation_profit_onhouse=total_profit_onhouse,
            notes="",
            has_been_edited=False,
            working_type="subcontractor" if is_on_subcontractor else "onhouse",
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
        )
        project_profit.save()

        return Response(
            {'message': f'Project profit report for {project.name} created successfully'},
            status=201
        )
    
    
def update_profit_report(id: str, request) -> Response:
    project_profit = ProjectProfitReport.objects(id=id).first()
    if not project_profit:
        return Response({'error': 'Project report not found'}, status=400)
    
    data = request.data
    
    user_reporter = data.get("userReporter", "")
    
    if isinstance(user_reporter, str):
        user_reporter = json.loads(user_reporter)
    
    notes = data.get("notes", "")
    duration = data.get("duration", 0)
    project_amount = data.get("projectAmount", 0)
    installation_amount = data.get("installationAmount", 0)
    installation_cost = data.get("installationCost", 0)
    installation_profit = data.get("installationProfit", 0)
    
    
    new_project_info = {
        **project_profit.project_info,
        "duration": duration,
    }
    project_profit.notes = notes
    project_profit.project_info = new_project_info
    project_profit.project_amount = project_amount
    project_profit.installation_amount = installation_amount
    project_profit.installation_cost = installation_cost
    project_profit.installation_profit = installation_profit
    project_profit.has_been_edited = True
    project_profit.last_modified_time = timezone.now()
    project_profit.save()
    
    tracking_info = transform_data_to_mongo(
        project_profit,
        include_fields=[
            "id", 
            "project_id", 
            "project_info", 
            "project_amount", 
            "installation_amount", 
            "installation_cost", 
            "installation_profit", 
            "notes"
        ],
    )
    
    if tracking_info:
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'Updated profit report for project {project_profit.project_info.get("name", "")}',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
    if user_reporter:
        module = 'projects'
        info = f'has updated profit report for project {project_profit.project_info.get("name", "")}'
        info_id = project_profit.project_id
        type = 'update_profit_report'
        create_notification(module, info_id, info, type, user_reporter.get('username', ''))

    return Response(
        {'message': f'Project profit report updated successfully'},
        status=200
    )