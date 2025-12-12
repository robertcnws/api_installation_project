# api_projects/views_timer.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from api_projects.models_extra import TaskTimer
from api_projects.models_serializer import TaskTimerSerializer


def _get_or_create_timer(username: str, entity_type: str, entity_id: str, entity_info: any = None) -> TaskTimer:
    """
    get_or_create versión MongoEngine.
    """
    timer = TaskTimer.objects(
        # username=username,
        entity_type=entity_type or "",
        entity_id=str(entity_id),
    ).first()

    if not timer:
        timer = TaskTimer(
            username=username,
            entity_type=entity_type or "",
            entity_id=str(entity_id),
            entity_info=entity_info if entity_info is not None else {},
            elapsed_ms=0,
            is_running=False,
            start_time=None,
        )
    elif entity_info is not None:
        timer.entity_info = entity_info
    timer.save()

    return timer


def timer_get(request, entity_type, entity_id):
    """
    Trae el timer de esa entidad para el usuario actual.
    GET /api/timers/<entity_type>/<entity_id>/
    """
    username = request.data.get("username") or request.user.username

    timer = TaskTimer.objects(
        # username=username,
        entity_type=entity_type or "",
        entity_id=str(entity_id),
    ).first()

    if not timer:
        # devolvemos estructura default
        data = {
            "id": None,
            "username": username,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "elapsed_ms": 0,
            "current_elapsed_ms": 0,
            "is_running": False,
            "start_time": None,
            "created_at": None,
            "updated_at": None,
        }
        return Response(data, status=status.HTTP_200_OK)

    serializer = TaskTimerSerializer(timer)
    return Response(serializer.data, status=status.HTTP_200_OK)


def timer_start(request):
    """
    Arranca (o continúa) el timer para entity_type + entity_id.
    POST /api/timers/start/
    body: { "entityType": "...", "entityId": "..." }
    """
    username = request.data.get("username") or request.user.username
    entity_type = request.data.get("entityType", "")
    entity_id = request.data.get("entityId")
    entity_info = request.data.get("entityInfo", None)

    if not entity_id:
        return Response(
            {"error": "entityId is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    timer = _get_or_create_timer(username, entity_type, entity_id, entity_info)
        
    timer.start()
    timer.save()

    serializer = TaskTimerSerializer(timer)
    return Response(serializer.data, status=status.HTTP_200_OK)



def timer_pause(request):
    """
    Pausa el timer y acumula el tiempo.
    POST /api/timers/pause/
    body: { "entityType": "...", "entityId": "..." }
    """
    username = request.data.get("username") or request.user.username
    entity_type = request.data.get("entityType", "")
    entity_id = request.data.get("entityId")

    if not entity_id:
        return Response(
            {"error": "entityId is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    timer = TaskTimer.objects(
        # username=username,
        entity_type=entity_type or "",
        entity_id=str(entity_id),
    ).first()

    if not timer:
        return Response(
            {"error": "Timer not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    timer.pause()
    timer.save()

    serializer = TaskTimerSerializer(timer)
    return Response(serializer.data, status=status.HTTP_200_OK)


def timer_reset(request):
    """
    Resetea el timer a 0.
    POST /api/timers/reset/
    body: { "entityType": "...", "entityId": "..." }
    """
    username = request.data.get("username") or request.user.username
    entity_type = request.data.get("entityType", "")
    entity_id = request.data.get("entityId")

    if not entity_id:
        return Response(
            {"error": "entityId is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    timer = TaskTimer.objects(
        # username=username,
        entity_type=entity_type or "",
        entity_id=str(entity_id),
    ).first()

    if not timer:
        timer = _get_or_create_timer(username, entity_type, entity_id)

    timer.reset()
    timer.save()

    serializer = TaskTimerSerializer(timer)
    return Response(serializer.data, status=status.HTTP_200_OK)
