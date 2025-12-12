# api_projects/models_timer.py
from mongoengine import (
    Document,
    StringField,
    BooleanField,
    DateTimeField,
    LongField,
    DynamicField,
)
from django.utils import timezone
from datetime import timezone as dt_timezone


def _to_aware(dt):
    """
    Convierte un datetime naive en aware usando la zona por defecto de Django.
    Si ya es aware, lo devuelve tal cual.
    """
    if dt is None:
        return None
    if timezone.is_aware(dt):
        return dt
    return timezone.make_aware(dt, dt_timezone.utc)


class TaskTimer(Document):
    """
    Timer por usuario (username) y por entidad (project, work_order, etc.)
    Guardado en MongoDB con MongoEngine.
    """

    username = StringField(required=True)  # request.user.username
    entity_type = StringField(default="", max_length=50)  # 'project', 'work_order', etc.
    entity_id = StringField(required=True, max_length=100)  # id del project, work_order, etc.
    
    entity_info = DynamicField()  # Información adicional opcional sobre la entidad

    # ms acumulados cuando está en pausa
    elapsed_ms = LongField(default=0)

    # cuándo se dio Start por última vez (None si está pausado)
    start_time = DateTimeField(null=True)
    is_running = BooleanField(default=False)

    created_time = DateTimeField(default=timezone.now)
    last_modified_time = DateTimeField(default=timezone.now)

    meta = {
        "collection": "task_timers",
        "indexes": [
            {
                "fields": ["username", "entity_type", "entity_id"],
                "unique": True,
            }
        ],
    }

    def clean(self):
        # actualizar last_modified_time en cada save
        self.last_modified_time = timezone.now()

    def __str__(self):
        return f"{self.username} - {self.entity_type}:{self.entity_id}"

    # -------- Lógica interna del timer --------
    def get_current_elapsed_ms(self) -> int:
        """
        Devuelve el tiempo total transcurrido en ms:
        - Si está pausado → elapsed_ms.
        - Si está corriendo → elapsed_ms + (now - start_time).
        Siempre normalizando aware/naive para no romper.
        """
        base = self.elapsed_ms or 0

        if not self.is_running or not self.start_time:
            return int(base)

        now = timezone.now()
        start = _to_aware(self.start_time)

        # Por si acaso now viniera naive (no debería, pero por seguridad)
        if timezone.is_naive(now):
            now = timezone.make_aware(now, timezone.utc)

        delta = now - start
        return int(base + delta.total_seconds() * 1000)

    def start(self):
        """
        Poner en marcha: setea start_time y is_running.
        NO toca elapsed_ms.
        """
        if not self.is_running:
            self.start_time = timezone.now()
            self.is_running = True

    def pause(self):
        """
        Pausar: acumula lo corrido en elapsed_ms y limpia start_time.
        """
        if self.is_running and self.start_time:
            now = timezone.now()
            start = _to_aware(self.start_time)
            delta = now - start
            self.elapsed_ms += int(delta.total_seconds() * 1000)
        self.is_running = False
        self.start_time = None

    def reset(self):
        """
        Poner el timer en cero.
        """
        self.is_running = False
        self.start_time = None
        self.elapsed_ms = 0
