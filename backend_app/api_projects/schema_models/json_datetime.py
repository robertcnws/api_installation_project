import graphene
import orjson
from datetime import datetime
# from api_projects.data_util import serialize_datetime
from datetime import datetime
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
            default=lambda obj: datetime_to_timezone(obj) if isinstance(obj, datetime) else obj
        )
        return orjson.loads(dumped)

    @staticmethod
    def parse_value(value):
        return value

    @staticmethod
    def parse_literal(ast, variables=None):
        return ast.value
    

def datetime_to_timezone(dt):
    try:
        if timezone.is_naive(dt):
            local_tz = timezone.get_current_timezone()
            dt = timezone.make_aware(dt, local_tz)
        local_dt = timezone.localtime(dt)
        return local_dt.strftime('%Y-%m-%d %H:%M:%S')
    except Exception as e:
        return dt.strftime('%Y-%m-%d %H:%M:%S') if isinstance(dt, datetime) else dt