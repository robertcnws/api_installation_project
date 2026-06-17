from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse
from api_projects.repository.project_profit_report_repository import manage_profit_report
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from api_projects.models import Project
from api_projects.tasks import task_rebuild_scope_and_materials_in_project, task_manage_profit_single_report
from api_services.models import Service
import json
import requests
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

#############################################
# HEADERS
#############################################

def config_headers():
    token = settings.API_MAIN_DATA_TOKEN
    headers = {
        "Authorization": f"Token {token}"
    }
    return headers

#############################################
# LOAD SALES ORDERS
#############################################
    
@api_view(['GET'])
@permission_classes([AllowAny])
def list_sales_orders(request):
    headers = config_headers()
    data = request.query_params if hasattr(request, 'query_params') else request.GET
    start_date = data.get('start_date', None)
    end_date = data.get('end_date', None)
    installation_name = data.get('installation_name', 'INSTALLATION')
    not_sales_orders_ids = data.getlist('not_sales_order_ids')
    if not_sales_orders_ids:
        if len(not_sales_orders_ids) == 1 and ',' in not_sales_orders_ids[0]:
            not_sales_orders_ids = not_sales_orders_ids[0].split(',')
        else:
            pass
        not_sales_orders_ids = ','.join(not_sales_orders_ids)
    else:
        not_sales_orders_ids = data.get('not_sales_order_ids', None)
    url = f'{settings.API_MAIN_DATA_URL}/zoho/full_sales_orders/?page=1&page_size=200'
    params = []
    if start_date:
        params.append(f"start_date={start_date}")
    if end_date:
        params.append(f"end_date={end_date}")
    if installation_name:
        params.append(f"installation_name={installation_name}")
    if not_sales_orders_ids:
        params.append(f"not_sales_orders_ids={not_sales_orders_ids}")
    if len(params) > 0:
        url = f"{url}&{'&'.join(params)}"
    print(f"url: {url}")
    items_to_get = []
    session = requests.Session()
    while True:
        try:
            response = session.get(url, headers=headers)
            response.raise_for_status()
            items = response.json()
            items_confirmed = [item for item in items.get('results', []) if item.get('status', None).lower() != 'draft']
            items_to_get.extend(items_confirmed)
            items_to_get = [item for item in items_to_get if item.get('zoho_org_id', None) == settings.ZOHO_ORG_ID]
            if not items.get('next', None):
                break
            params['page'] += 1
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching sales orders: {e}")
            return JsonResponse({'error': 'Failed to fetch sales orders'}, status=500)
    return JsonResponse({'count': len(items_to_get), 'results': items_to_get})


#############################################
# LOAD CUSTOMERS
#############################################
    
@api_view(['GET'])
@permission_classes([AllowAny])
def list_customers(request):
    headers = config_headers()
    data = request.query_params if hasattr(request, 'query_params') else request.GET
    first_name = data.get('firstName', None)
    last_name = data.get('lastName', None)
    zoho_org_id = data.get('zohoOrgId', None)
    phone = data.get('phone', None)
    mobile = data.get('mobile', None)
    email = data.get('email', None)
    params = []
    params.append(f"page=1")
    params.append(f"page_size=200")
    url = f'{settings.API_MAIN_DATA_URL}/zoho/customers/?'
    if first_name and first_name != '':
        params.append(f"first_name={first_name}")
    if last_name and last_name != '':
        params.append(f"last_name={last_name}")
    if zoho_org_id and zoho_org_id != '':
        params.append(f"zoho_org_id={zoho_org_id}")
    if phone and phone != '':
        params.append(f"phone={phone}")
    if mobile and mobile != '':
        params.append(f"mobile={mobile}")
    if email and email != '':
        params.append(f"email={email}")
    
    if len(params) > 0:
        url = f"{url}{'&'.join(params)}"
    
    items_to_get = []
    session = requests.Session()
    while True:
        try:
            response = session.get(url, headers=headers)
            response.raise_for_status()
            items = response.json()
            items_confirmed = [item for item in items.get('results', []) if item.get('status', None).lower() != 'draft']
            items_to_get.extend(items_confirmed)
            items_to_get = [item for item in items_to_get if item.get('zoho_org_id', None) == zoho_org_id]
            if not items.get('next', None):
                break
            params['page'] += 1
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching sales orders: {e}")
            return JsonResponse({'error': 'Failed to fetch customers'}, status=500)
    return JsonResponse({'count': len(items_to_get), 'results': items_to_get})


#############################################
# LOAD SALES ORDERS TO SERVICE
#############################################
    
@api_view(['GET'])
@permission_classes([AllowAny])
def list_salesorder_to_service(request):
    headers = config_headers()
    data = request.query_params if hasattr(request, 'query_params') else request.GET
    company_name = data.get('companyName', None)
    first_name = data.get('firstName', None)
    last_name = data.get('lastName', None)
    phone = data.get('phone', None)
    mobile = data.get('mobile', None)
    email = data.get('email', None)
    salesorder_number = data.get('salesorderNumber', None)
    is_not_recent = data.get('isNotRecent')
    print('isinstance(is_not_recent, str): ', isinstance(is_not_recent, str))
    if isinstance(is_not_recent, str):
        print('is_not_recent.lower() == false: ', is_not_recent.lower() == 'false')
        is_not_recent = is_not_recent.lower() == 'false'
    is_recent = 'true' if not is_not_recent else 'false'
    params = []
    url = f'{settings.API_MAIN_DATA_URL}/zoho/sales_orders_to_service/?'
    if company_name and company_name != '':
        params.append(f"company_name={company_name}")
    if first_name and first_name != '':
        params.append(f"first_name={first_name}")
    if last_name and last_name != '':
        params.append(f"last_name={last_name}")
    if phone and phone != '':
        params.append(f"phone={phone}")
    if mobile and mobile != '':
        params.append(f"mobile={mobile}")
    if email and email != '':
        params.append(f"email={email}")
    if salesorder_number and salesorder_number != '':
        if 'SO-' not in salesorder_number:
            salesorder_number = f'SO-{salesorder_number}'
        params.append(f"salesorder_number={salesorder_number}")    
    params.append(f"is_recent={is_recent}")
    
    if len(params) > 0:
        url = f"{url}{'&'.join(params)}"
    
    items_to_get = []
    session = requests.Session()
    while True:
        try:
            response = session.get(url, headers=headers)
            response.raise_for_status()
            items = response.json()
            items_confirmed = [item for item in items.get('results', []) if item.get('status', None).lower() != 'draft']
            items_to_get.extend(items_confirmed)
            if not items.get('next', None):
                break
            params['page'] += 1
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching sales orders: {e}")
            return JsonResponse({'error': 'Failed to fetch sales orders to service'}, status=500)
    return JsonResponse({'count': len(items_to_get), 'results': items_to_get})


#############################################
# REFETCH SALES ORDERS TO PROJECT
#############################################
    
@api_view(['GET'])
@permission_classes([AllowAny])
def refetch_salesorder(request, project_id):
    project = Project.objects(id=project_id).first()
    salesorder_number = project.sales_order.get('salesorder_number', None)
    if not salesorder_number:
        return JsonResponse({'error': 'Missing salesorder_number in project'}, status=400)
    zogo_org_id = settings.ZOHO_ORG_ID
    headers = config_headers()
    url = f'{settings.API_MAIN_DATA_URL}/zoho/refetch_salesorder/{zogo_org_id}/{salesorder_number}/'
    items_to_get = []
    session = requests.Session()
    while True:
        try:
            response = session.get(url, headers=headers)
            response.raise_for_status()
            items = response.json()
            items_confirmed = [item for item in items.get('results', []) if item.get('status', None).lower() != 'draft']
            items_to_get.extend(items_confirmed)
            if not items.get('next', None):
                break
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching sales orders: {e}")
            return JsonResponse({'error': 'Failed to fetch sales orders to service'}, status=500)
    if len(items_to_get) > 0:
        project.sales_order = items_to_get[0]
        project.save()
        manage_profit_report(str(project.id), force_update=True)
        task_rebuild_scope_and_materials_in_project.delay(str(project.id))
    return JsonResponse({'message': 'Sales order refetched successfully'})


#############################################
# REFETCH SALES ORDERS TO SERVICE
#############################################
    
@api_view(['GET'])
@permission_classes([AllowAny])
def refetch_salesorder_service(request, service_id):
    service = Service.objects(id=service_id).first()
    salesorder_number = service.sales_order.get('salesorder_number', None)
    if not salesorder_number:
        return JsonResponse({'error': 'Missing salesorder_number in service'}, status=400)
    
    headers = config_headers()
    
    def get_sales_orders(url):
        items_to_get = []
        session = requests.Session()
        while True:
            try:
                response = session.get(url, headers=headers)
                response.raise_for_status()
                items = response.json()
                items_confirmed = [item for item in items.get('results', []) if item.get('status', None).lower() != 'draft']
                items_to_get.extend(items_confirmed)
                if not items.get('next', None):
                    break
            except requests.exceptions.RequestException as e:
                logger.error(f"Error fetching sales orders: {e}")
                return JsonResponse({'error': 'Failed to fetch sales orders to service'}, status=500)
        return items_to_get
    
    zogo_org_id = settings.ZOHO_ORG_ID
    url = f'{settings.API_MAIN_DATA_URL}/zoho/refetch_salesorder/{zogo_org_id}/{salesorder_number}/'
    items_to_get = get_sales_orders(url)
    
    if len(items_to_get) == 0:
        zoho_org_nws_id = settings.ZOHO_ORG_NWS_ID
        url = f'{settings.API_MAIN_DATA_URL}/zoho/refetch_salesorder/{zoho_org_nws_id}/{salesorder_number}/'
        items_to_get = get_sales_orders(url)
        
    if len(items_to_get) > 0:
        service.sales_order = items_to_get[0]
        service.save()
        
    return JsonResponse({'message': 'Sales order refetched successfully'})


#############################################
# LOAD PERMISSIONS USERS
#############################################
    
@api_view(['GET'])
@permission_classes([AllowAny])
def list_users_permissions(request):
    url = settings.API_USER_DATA_URL + '/auth/users/permissions/'
    headers = config_headers()
    data = request.query_params if hasattr(request, 'query_params') else request.GET
    username = data.get('username', None)
    params = {
        'username': username,
        'page': data.get('page', 1),
        'page_size': data.get('page_size', 200)
    }
    items_to_get = []
    session = requests.Session()
    while True:
        try:
            response = session.get(url, headers=headers, params=params)
            response.raise_for_status()
            items = response.json()
            items_to_get.extend(items.get('results', []))
            if not items.get('next', None):
                break
            params['page'] += 1
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching users permissions: {e}")
            return JsonResponse({'error': 'Failed to fetch users permissions'}, status=500)
    return JsonResponse({
        'count': len(items_to_get), 
        'count_permissions': sum([len(user.get('permissions', [])) for user in items_to_get]),
        'results': items_to_get
    })
    
    
#############################################
# MANAGE USER PERMISSIONS
#############################################
    
@api_view(['POST'])
@permission_classes([AllowAny])
def manage_user_permissions(request):
    url = settings.API_USER_DATA_URL + '/auth/users/manage-user-permissions/'
    headers = config_headers()
    data = request.data
    session = requests.Session()
    try:
        response = session.post(url, headers=headers, json=data)
        response.raise_for_status()
        resp = response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error managing user permissions: {e}")
        return JsonResponse({'error': 'Failed to managing user permissions'}, status=500)
    return JsonResponse(resp)


@api_view(['GET'])
@permission_classes([AllowAny])
def delete_sales_orders(request):
    headers = config_headers()
    data = request.query_params if hasattr(request, 'query_params') else request.GET
    print(f"data: {data}")
    sales_orders_ids = data.get('sales_orders_ids', None)
    if not sales_orders_ids:
        return JsonResponse({'error': 'Missing sales_orders_ids parameter'}, status=400)
    if isinstance(sales_orders_ids, list):
        sales_orders_ids = ','.join(sales_orders_ids)
    url = f'{settings.API_MAIN_DATA_URL}/zoho/delete/sales_orders/?sales_orders_ids={sales_orders_ids}'
    
    session = requests.Session()
    try:
        response = session.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        resp = response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error deleting sales orders: {e}")
        return JsonResponse({'error': 'Failed to delete sales orders'}, status=500)
    
    return JsonResponse(resp)
    
    
    
