from rest_framework.response import Response
from django.utils import timezone
from api_projects.models import (
    ProjectTracking,
    ProjectDefaultGuideProduct,
)
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
)
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

#############################################
# CREATE DEFAULT GUIDE PRODUCT
#############################################

def create_default_guide_product(request):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        order = data.get('order', 0)
        price = data.get('price', 0)
        product = ProjectDefaultGuideProduct.objects(name=name).first()
        if product:
            return Response({'error': 'Default guide product already exists'}, status=404)
        product = ProjectDefaultGuideProduct.objects(order=order).first()
        if product:
            return Response({'error': 'Default guide product with this order already exists'}, status=404)
        product = ProjectDefaultGuideProduct(
            name=name,
            order=order,
            price=price,    
            description=description,
            created_time=timezone.now(),
            last_modified_time=timezone.now()
        )
        product.save()
        tracking_info = transform_data_to_mongo(product)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create default guide product ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='default_guide_products'
            info=f'has created new default guide product {product.name}'
            info_id=product.id
            type='create_default_guide_product'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Default guide product created successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# EDIT DEFAULT GUIDE PRODUCT
#############################################

def edit_default_guide_product(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        order = data.get('order', 0)
        price = data.get('price', 0)
        product = ProjectDefaultGuideProduct.objects(name=name).first()
        if product and str(product.id) != id:
            return Response({'error': 'Default guide product already exists'}, status=404)
        product = ProjectDefaultGuideProduct.objects(order=order).first()
        if product and str(product.id) != id:
            return Response({'error': 'Default guide product with this order already exists'}, status=404)
        product = ProjectDefaultGuideProduct.objects(id=id).first()
        if not product:
            return Response({'error': 'Stage not found'}, status=404)
        product.name = name
        product.price = price
        product.description = description
        product.order = order
        product.last_modified_time = timezone.now()
        product.save()
        tracking_info = transform_data_to_mongo(product)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update default guide product ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='default_guide_products'
            info=f'has updated default guide product {product.name}'
            info_id=product.id
            type='update_default_guide_product'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Default guide product updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE DEFAULT GUIDE PRODUCT
#############################################

def delete_default_guide_product(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        product = ProjectDefaultGuideProduct.objects(id=id).first()
        if not product:
            return Response({'error': 'Default guide product not found'}, status=404)
        tracking_info = transform_data_to_mongo(product)
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete default guide product ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='default_guide_products'
            info=f'has deleted default guide product {product.name}'
            info_id=product.id
            type='delete_default_guide_product'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        product.delete()
        
        return Response({'message': 'Default guide product deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# DELETE DEFAULT GUIDE PRODUCTS
#############################################

def delete_default_guide_products(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    try:
        products = ProjectDefaultGuideProduct.objects(id__in=ids).all()
        if not products:
            return Response({'error': 'Default guide products not found'}, status=404)
        tracking_info = [transform_data_to_mongo(p) for p in products]
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete list default guide products',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='default_guide_products'
            info=f'has deleted {len(ids)} default guide products'
            info_id='list'
            type='delete_default_guide_products'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        ProjectDefaultGuideProduct.objects(id__in=ids).delete()
        
        return Response({'message': 'Default guide products deleted successfully'})
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)