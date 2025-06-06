import graphene
import orjson
from datetime import datetime
# from api_projects.data_util import serialize_datetime
from datetime import datetime, timezone as dt_timezone
from django.utils import timezone


class JSONDateTime(graphene.Scalar):
    """
    Serializa dicts/lists anidados, aplicando
    datetime_to_timezone a cada datetime.
    """
    @staticmethod
    def serialize(value):
        dumped = orjson.dumps(
            value,
            default=lambda obj: datetime_to_timezone(obj)
        )
        return orjson.loads(dumped)

    @staticmethod
    def parse_value(value):
        return value

    @staticmethod
    def parse_literal(ast, variables=None):
        return ast.value
    

def datetime_to_timezone(dt):
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=dt_timezone.utc)
    try:
        local_dt = dt.astimezone(timezone.get_default_timezone())
        return local_dt.strftime('%Y-%m-%d %H:%M:%S')
    except Exception:
        if isinstance(dt, datetime):
            return dt.strftime('%Y-%m-%d %H:%M:%S')
        return dt
    
    
def serialize_datetime(value):
    if isinstance(value, datetime):
        if timezone.is_naive(value):
            local_tz = timezone.get_current_timezone()
            # local_tz = dt_timezone.utc
            value = timezone.make_aware(value, local_tz) 
        local_dt = timezone.localtime(value)  
        return local_dt.isoformat()
    elif isinstance(value, dict):
        return {key: serialize_datetime(val) for key, val in value.items()}
    elif isinstance(value, list):
        return [serialize_datetime(item) for item in value]
    else:
        return value