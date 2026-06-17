# api_projects/serializers_timer.py
from rest_framework import serializers
from .models_extra import TaskTimer


class TaskTimerSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    username = serializers.CharField()
    entity_type = serializers.CharField()
    entity_id = serializers.CharField()
    entity_info = serializers.JSONField(required=False)

    elapsed_ms = serializers.IntegerField()
    current_elapsed_ms = serializers.IntegerField()
    is_running = serializers.BooleanField()
    start_time = serializers.DateTimeField(allow_null=True)
    created_time = serializers.DateTimeField(allow_null=True)
    last_modified_time = serializers.DateTimeField(allow_null=True)

    def to_representation(self, instance: TaskTimer):
        return {
            "id": str(instance.id),
            "username": instance.username,
            "entity_type": instance.entity_type,
            "entity_id": instance.entity_id,
            "entity_info": instance.entity_info,
            "elapsed_ms": instance.elapsed_ms or 0,
            "current_elapsed_ms": instance.get_current_elapsed_ms(),
            "is_running": instance.is_running,
            "start_time": instance.start_time,
            "created_time": instance.created_time,
            "last_modified_time": instance.last_modified_time,
        }
