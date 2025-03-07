from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, BACKEND_SESSION_KEY
from django.http import Http404, JsonResponse
from django.utils import timezone
from bson.objectid import ObjectId
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .models import LoginUser
from api_projects.models import ProjectTracking
import json
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


# HEALTH CHECK VIEW

@csrf_exempt
def health_check(request):
    return JsonResponse({'status': 'ok'})


@csrf_exempt
def login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)  
            username = data.get('username')  
            password = data.get('password') 
            if not username or not password:
                return JsonResponse({'error': 'Username and password required', 'description': 'Username and password required'}, status=400)
            user = authenticate(request, username=username, password=password)
            if user is not None:
                user = user.to_mongo().to_dict()
                del user['password']
                if '_id' in user and isinstance(user['_id'], ObjectId):
                    user['_id'] = str(user['_id'])
                request.session['user_id'] = user['_id']
                request.session[BACKEND_SESSION_KEY] = 'api_authorization.backends.MongoDBBackend'
                request.session.set_expiry(0)
                request.session.modified = True
                logger.info(f'User {username} logged in')
                tracking = ProjectTracking(
                    user_reporter=user,
                    action='login',
                    created_time=timezone.now(),
                    managed_data={
                        'data': user,
                    }
                )
                tracking.save()
                current_user = LoginUser.objects(username=username).first()
                current_user.last_login = timezone.now()
                current_user.save()
                return JsonResponse({'data': user}, status=200)
            login_user = LoginUser.objects(username=username).first()
            if login_user:
                return JsonResponse({'error': 'Invalid credentials', 'description' : 'Incorrect Password'}, status=400)
            else:
                return JsonResponse({'error': 'Invalid credentials', 'description' : 'Username does not exist'}, status=400)
        except json.JSONDecodeError:
            
            return JsonResponse({'error': 'Invalid JSON', 'description': 'Request is not in a valid format'}, status=400)
    return JsonResponse({'error': 'Method not allowed', 'description': 'Method not allowed'}, status=405)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    data = request.data
    user_reporter = data.get('userReporter', None)
    if user_reporter:
        request.session.flush()
        logger.info(f'User {user_reporter["username"]} logged out')
        tracking = ProjectTracking(
            user_reporter=user_reporter,
            action='logout',
            created_time=timezone.now(),
            managed_data={
                'data': user_reporter,
            }
        )
        tracking.save()
        return JsonResponse({'data': 'User logged out'}, status=200)
    return JsonResponse({'error': 'User not logged in', 'description': 'User not logged in'}, status=400)