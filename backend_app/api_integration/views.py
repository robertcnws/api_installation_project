from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
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
    print(f"data: {data}")
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
    url = settings.API_MAIN_DATA_URL + '/zoho/full_sales_orders/?page=1&page_size=200'
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
            if not items.get('next', None):
                break
            params['page'] += 1
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching sales orders: {e}")
            return JsonResponse({'error': 'Failed to fetch sales orders'}, status=500)
    return JsonResponse({'count': len(items_to_get), 'results': items_to_get})


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
    
    
