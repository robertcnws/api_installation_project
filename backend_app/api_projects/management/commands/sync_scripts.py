# management/commands/sync_dashboard.py
from django.core.management.base import BaseCommand
from api_projects.models import Project
from api_projects.signals import sync_project

class Command(BaseCommand):
    help = "Synchronize all projects with MongoDB"

    def handle(self, *args, **options):
        count = 0
        for p in Project.objects.all():
            sync_project(sender=Project, document=p)
            count += 1
        self.stdout.write(f"{count} projects synchronized.")