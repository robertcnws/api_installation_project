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

# ----------------------------------------------------------------------
# Lógica principal
# ----------------------------------------------------------------------
def manage_profit_report(project_id: str, force_update=False) -> Response:
    project = Project.objects(id=project_id).first()
    if not project:
        return Response({'error': 'Project not found'}, status=400)

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

    # ---- Info del proyecto ----
    project_info = transform_data_to_mongo(
        project,
        include_fields=["id", "name", "number", "start_date", "duration"],
    )
    
    project_amount_f = float(total_sales_order or 0)
    installation_amount_f = float(total_installation or 0)
    installation_cost_f = float(total_installing or 0)
    installation_profit_f = float(total_profit or 0)

    if force_update and project_profit:
        project_profit.project_info = project_info
        project_profit.project_amount = project_amount_f
        project_profit.installation_amount = installation_amount_f
        project_profit.installation_cost = installation_cost_f
        project_profit.installation_profit = installation_profit_f
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
            installation_cost=total_installing,      # lo que te cuesta instalar
            installation_profit=total_profit,        # utilidad
            notes="",
            has_been_edited=False,
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