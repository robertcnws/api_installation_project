from rest_framework.response import Response
from django.utils import timezone
from api_projects.models import (
    ProjectTracking,
    ProjectDefaultMaterial,
)
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
)
import json
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


#############################################
# CREATE DEFAULT MATERIAL
#############################################

def create_default_material(request):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    try:
        name = data.get('name')
        description = data.get('description')
        price = data.get('price', 0)
        quantity = data.get('quantity', 0)
        is_packaged = data.get('isPackaged', False)
        package_quantity = data.get('packageQuantity', 0)
        default_guide_products = json.loads(data.get('defaultGuideProducts', '[]'))
        material = ProjectDefaultMaterial.objects(name=name).first()
        if material:
            return Response({'error': 'Default material already exists'}, status=404)
        material = ProjectDefaultMaterial(
            name=name,
            price=price,    
            description=description,
            quantity=quantity,
            is_packaged=is_packaged,
            package_quantity=package_quantity,
            default_guide_products=default_guide_products,
            created_time=timezone.now(),
            last_modified_time=timezone.now()
        )
        material.save()
        tracking_info = transform_data_to_mongo(material)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create default material ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='default_materials'
            info=f'has created new default material {material.name}'
            info_id=material.id
            type='create_default_material'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Default material created successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# EDIT DEFAULT MATERIAL
#############################################

def edit_default_material(request, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    try:
        name = data.get('name')
        description = data.get('description')
        price = data.get('price', 0)
        quantity = data.get('quantity', 0)
        is_packaged = data.get('isPackaged', False)
        package_quantity = data.get('packageQuantity', 0)
        default_guide_products = json.loads(data.get('defaultGuideProducts', '[]'))
        
        material = ProjectDefaultMaterial.objects(name=name).first()
        
        if material and str(material.id) != id:
            return Response({'error': 'Default material already exists'}, status=404)
        
        material = ProjectDefaultMaterial.objects(id=id).first()
        if not material:
            return Response({'error': 'Material not found'}, status=404)
        material.name = name
        material.price = price
        material.description = description
        material.quantity = quantity
        material.is_packaged = is_packaged
        material.package_quantity = package_quantity
        material.default_guide_products = default_guide_products
        material.last_modified_time = timezone.now()
        material.save()
        tracking_info = transform_data_to_mongo(material)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update default material ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='default_materials'
            info=f'has updated default material {material.name}'
            info_id=material.id
            type='update_default_material'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Default material updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE DEFAULT MATERIAL
#############################################

def delete_default_material(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        material = ProjectDefaultMaterial.objects(id=id).first()
        if not material:
            return Response({'error': 'Default material not found'}, status=404)
        tracking_info = transform_data_to_mongo(material)
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete default material ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='default_materials'
            info=f'has deleted default material {material.name}'
            info_id=material.id
            type='delete_default_material'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        material.delete()
        
        return Response({'message': 'Default material deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
#############################################
# DELETE DEFAULT MATERIAL
#############################################

def delete_default_materials(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    try:
        materials = ProjectDefaultMaterial.objects(id__in=ids).all()
        if not materials:
            return Response({'error': 'Default materials not found'}, status=404)
        tracking_info = [transform_data_to_mongo(p) for p in materials]
        
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete list default materials',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        
        if user_reporter:
            module='default_materials'
            info=f'has deleted {len(ids)} default materials'
            info_id='list'
            type='delete_default_materials'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
        ProjectDefaultMaterial.objects(id__in=ids).delete()
        
        return Response({'message': 'Default materials deleted successfully'})
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)