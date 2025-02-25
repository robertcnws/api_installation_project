# myapp/schema.py
import graphene
from graphene_mongo import MongoengineObjectType
from mongoengine.fields import DynamicField
from graphene_mongo.converter import convert_mongoengine_field
from graphene.types.generic import GenericScalar
from .models import (
    UserRole,
)
from api_authorization.models import LoginUser
from api_projects.data_util import serialize_datetime, dynamic_field_to_json
from bson import ObjectId

@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )
    
class LoginUserType(MongoengineObjectType):
    class Meta:
        model = LoginUser
    user_role = GenericScalar()
    
    def resolve_user_role(self, info):
        user_role = self.user_role or {}
        user_role = serialize_datetime(user_role)
        return dynamic_field_to_json(user_role)
        
class UserRoleType(MongoengineObjectType):
    class Meta:
        model = UserRole
    

class Query(graphene.ObjectType):
    all_login_users = graphene.List(LoginUserType)
    all_user_roles = graphene.List(UserRoleType, excluding_names=graphene.List(graphene.String))
    
    def resolve_all_login_users(self, info):
        return list(LoginUser.objects.all())
    
    def resolve_all_user_roles(self, info, excluding_names=None):
        if excluding_names:
            return list(filter(lambda x: x.name not in excluding_names, UserRole.objects.all()))
        return list(UserRole.objects.all())

schema = graphene.Schema(query=Query)
