from rest_framework.response import Response
from django.utils import timezone
from api_projects.models import (
    ProjectTracking,
    ProjectNotification,
    ProjectNotificationUser,
)
from api_projects.data_util import (
    transform_data_to_mongo,
)
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)
    

#############################################
# REMOVE ALL NOTIFICATIONS
#############################################

def remove_old_notifications(request):
    now = timezone.now()
    days_ago = now - timezone.timedelta(days=7)
    ProjectNotificationUser.objects(updated_at__lt=days_ago).delete()
    ProjectNotification.objects(updated_at__lt=days_ago).delete()
    return Response({'message': '7 days old Notifications removed successfully'}, status=200)


#############################################
# DELETE NOTIFICATIONS
#############################################

def delete_notifications(request):
    data = request.data
    userReporter = data.get('userReporter', None)
    if not userReporter:
        return Response({'error': 'User not found'}, status=404)
    notification_ids = data.get('notificationIds', [])
    notifications = ProjectNotificationUser.objects(id__in=notification_ids).all()
    tracking_info = [transform_data_to_mongo(notification) for notification in notifications]
    notifications.delete()
    
    tracking = ProjectTracking(
        user_reporter=userReporter,
        action=f'delete notifications',
        created_time=timezone.now(),
        managed_data={
            'data': tracking_info
        },
    )
    tracking.save()
    
    return Response({'message': 'Notifications marked as read successfully'}, status=200)


#############################################
# MARK AS READ NOTIFICATIONS
#############################################

def mark_as_read_notifications(request):
    data = request.data
    userReporter = data.get('userReporter', None)
    if not userReporter:
        return Response({'error': 'User not found'}, status=404)
    notification_ids = data.get('notificationIds', [])
    notifications = ProjectNotificationUser.objects(id__in=notification_ids).all()
    for notification in notifications:
        notification.read = True
        notification.save()
        
    tracking_info = [transform_data_to_mongo(notification) for notification in notifications]
    
    tracking = ProjectTracking(
        user_reporter=userReporter,
        action=f'mark as read notifications',
        created_time=timezone.now(),
        managed_data={
            'data': tracking_info
        },
    )
    tracking.save()
    
    return Response({'message': 'Notifications marked as read successfully'}, status=200)


#############################################
# DELETE OLD NOTIFICATIONS
#############################################

def delete_old_notifications():
    cutoff = timezone.now() - timezone.timedelta(days=7)
    notifications = ProjectNotification.objects(created_time__lt=cutoff).all()
    old_notification_ids = [str(notification.id) for notification in notifications]
    ProjectNotificationUser.objects(__raw__={'notification.id': {'$in': old_notification_ids}}).delete()
    notifications.delete()
    return True