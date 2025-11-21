from rest_framework.response import Response
from django.utils import timezone
from api_projects.data_util import (
    transform_data_to_mongo,
    create_notification,
)
from api_projects.models import (
    ProjectTracking,
)

from api_services.models import (
    ServiceStage,
)


#############################################
# CREATE SERVICE STAGE
#############################################

def create_service_stage(request):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        order = data.get('order', 0)
        stage = ServiceStage.objects(name=name).first()
        if stage:
            return Response({'error': 'Stage already exists'}, status=404)
        stage = ServiceStage.objects(order=order).first()
        if stage:
            return Response({'error': 'Stage with this order already exists'}, status=404)
        stage = ServiceStage(
            name=name,
            order=order,
            description=description
        )
        stage.save()
        tracking_info = transform_data_to_mongo(stage)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'create service stage ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='service_stages'
            info=f'has created new service stage {stage.name}'
            info_id=stage.id
            type='create_service_stage'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Stage created successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# EDIT SERVICE STAGE
#############################################

def edit_service_stage(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        name = data.get('name')
        description = data.get('description')
        order = data.get('order', 0)
        stage = ServiceStage.objects(name=name).first()
        if stage and str(stage.id) != id:
            return Response({'error': 'Stage already exists'}, status=404)
        stage = ServiceStage.objects(order=order).first()
        if stage and str(stage.id) != id:
            return Response({'error': 'Stage with this order already exists'}, status=404)
        stage = ServiceStage.objects(id=id).first()
        if not stage:
            return Response({'error': 'Stage not found'}, status=404)
        stage.name = name
        stage.description = description
        stage.order = order
        stage.save()
        tracking_info = transform_data_to_mongo(stage)
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'update service stage ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='service_stages'
            info=f'has updated service stage {stage.name}'
            info_id=stage.id
            type='update_service_stage'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Stage updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE SERVICE STAGE
#############################################

def delete_service_stage(request, id):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try:
        stage = ServiceStage.objects(id=id).first()
        if not stage:
            return Response({'error': 'Stage not found'}, status=404)
        tracking_info = transform_data_to_mongo(stage)
        stage.delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete service stage ({tracking_info["id"]} - {tracking_info["name"]})',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='service_stages'
            info=f'has deleted service stage {stage.name}'
            info_id=stage.id
            type='delete_service_stage'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Stage deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
#############################################
# DELETE SERVICE STAGES
#############################################

def delete_service_stages(request):
    data = request.data
    ids = data.get('ids', [])
    user_reporter = data.get('userReporter', None)
    try:
        stages = ServiceStage.objects(id__in=ids).all()
        if not stages:
            return Response({'error': 'Stages not found'}, status=404)
        tracking_info = [transform_data_to_mongo(stage) for stage in stages]
        ServiceStage.objects(id__in=ids).delete()
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action=f'delete list service stages',
            created_time=timezone.now(),
            managed_data={
                'data': tracking_info
            },
        )
        tracking.save()
        if user_reporter:
            module='service_stages'
            info=f'has deleted {len(ids)} service stages'
            info_id='list'
            type='delete_service_stages'
            create_notification(module, info_id, info, type, user_reporter['username'])
        return Response({'message': 'Stages deleted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)