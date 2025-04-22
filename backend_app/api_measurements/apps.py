from django.apps import AppConfig


class ApiMeasurementsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api_measurements'
    
    def ready(self):
        import api_measurements.signals
