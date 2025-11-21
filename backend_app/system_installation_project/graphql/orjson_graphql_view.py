import orjson
from django.http import HttpResponse
from graphene_django.views import GraphQLView

class ORJSONGraphQLView(GraphQLView):
    def render(self, request, data, status=200):
        content = orjson.dumps(data)
        return HttpResponse(
            content,
            content_type='application/json',
            status=status
        )