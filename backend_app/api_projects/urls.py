# project/urls.py
from django.urls import path  
from django.conf.urls.static import static
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from graphene_django.views import GraphQLView
from .schema import schema
from . import views
urlpatterns = [
    path('graphql/', csrf_exempt(GraphQLView.as_view(graphiql=True, schema=schema))),
    path('delete/file/<str:id>/project/<str:folder>/<str:file>/', views.delete_project_file, name='delete_project_file'),
    path('delete/file/<str:projectId>/project/<str:id>/task/<str:folder>/<str:file>/', views.delete_default_task_file, name='delete_default_task_file'),
    # PROJECTS
    path('create/project/', views.create_project, name='create_project'),
    path('create/projects/', views.create_projects, name='create_projects'),
    path('update/projects/change-staff-all-projects/', views.change_staff_all_projects, name='change_staff_all_projects'),
    path('update/projects/change-description-all-projects/', views.change_description_all_projects, name='change_description_all_projects'),
    path('update/project/<str:id>/', views.update_project, name='update_project'),
    path('update/project/<str:id>/change-permission/', views.change_project_permission, name='change_project_permission'),
    path('update/project/<str:id>/change-address/', views.change_project_address, name='change_project_address'),
    path('update/project/<str:id>/change-phone-number/', views.change_project_phone_number, name='change_project_phone_number'),
    path('update/project/<str:id>/change-reference-number/', views.change_project_reference_number, name='change_project_reference_number'),
    path('update/project/<str:id>/change-release-form/', views.change_project_release_form, name='change_project_release_form'),
    path('update/project/<str:id>/change-installation-guide-form/', views.change_project_installation_guide_form, name='change_project_installation_guide_form'),
    path('update/project/<str:id>/check-item-installation-guide/', views.check_project_item_installation_guide, name='check_project_item_installation_guide'),
    path('update/project/<str:id>/remove-date/', views.remove_date_project, name='remove_date_project'),
    path('update/project/<str:id>/change-installer/', views.change_installer_project, name='change_installer_project'),
    path('update/project/<str:id>/change-description/', views.change_description_project, name='change_description_project'),
    path('delete/project/<str:id>/', views.delete_project, name='delete_project'),
    path('delete/projects/', views.delete_projects, name='delete_projects'),
    path('delete/project/<str:id>/user/<str:userId>/', views.delete_project_user, name='delete_project_user'),
    path('add/project/<str:id>/users/', views.add_project_users_assignees, name='add_project_users_assignees'),
    path('upload/project/<str:id>/file/', views.upload_files_to_project, name='upload_files_to_project'),
    path('upload/project/<str:projectId>/task/<str:id>/file/', views.upload_files_to_default_task, name='upload_files_to_default_task'),
    path('create/project/<str:id>/comment/', views.create_project_comment, name='create_project_comment'),
    path('edit/project/<str:projectId>/comment/<str:id>/', views.edit_project_comment, name='edit_project_comment'),
    path('delete/project/<str:projectId>/comment/<str:id>/', views.delete_project_comment, name='delete_project_comment'),
    path('delete/old-notifications/', views.remove_old_notifications, name='remove_old_notifications'),
    path('mark-read/notifications/', views.mark_as_read_notifications, name='mark_as_read_notifications'),
    path('delete/notifications/', views.delete_notifications, name='delete_notifications'),
    # PROJECT TASKS
    path('create/project/task/', views.create_project_task, name='create_project_task'),
    path('update/project/task/<str:id>/', views.update_project_task, name='update_project_task'),
    path('delete/project/<str:projectId>/task/<str:id>/', views.delete_project_task, name='delete_project_task'),
    path('delete/project/<str:projectId>/task/<str:id>/user/<str:userId>/', views.delete_project_task_user, name='delete_project_task_user'),
    path('add/project/<str:projectId>/task/<str:id>/users/', views.add_project_task_users_assignees, name='add_project_task_users_assignees'),
    path('update/project/<str:projectId>/task/<str:id>/change-status/', views.change_status_project_default_task, name='change_status_project_default_task'),
    path('update/project/<str:projectId>/task/<str:id>/change-priority/', views.change_priority_project_default_task, name='change_priority_project_default_task'),
    # PROJECT DEFAULT TASKS
    path('create/default-task/', views.create_default_task, name='create_default_task'),
    path('edit/default-task/<str:id>/', views.edit_default_task, name='edit_default_task'),
    path('delete/default-task/<str:id>/', views.delete_default_task, name='delete_default_task'),
    path('delete/default-tasks/', views.delete_default_tasks, name='delete_default_tasks'),
    # PROJECT STAGES
    path('create/stage/', views.create_stage, name='create_stage'),
    path('edit/stage/<str:id>/', views.edit_stage, name='edit_stage'),
    path('delete/stage/<str:id>/', views.delete_stage, name='delete_stage'),
    path('delete/stages/', views.delete_stages, name='delete_stages'),
    # PROJECT TASK STAGES
    path('create/stage-task/', views.create_stage_task, name='create_stage_task'),
    path('edit/stage-task/<str:id>/', views.edit_stage_task, name='edit_stage_task'),
    path('delete/stage-task/<str:id>/', views.delete_stage_task, name='delete_stage_task'),
    path('delete/stages-task/', views.delete_stages_task, name='delete_stages_task'),
    # PROJECT DEFAULT GUIDE PRODUCTS
    path('create/default-guide-product/', views.create_default_guide_product, name='create_default_guide_product'),
    path('edit/default-guide-product/<str:id>/', views.edit_default_guide_product, name='edit_default_guide_product'),
    path('delete/default-guide-product/<str:id>/', views.delete_default_guide_product, name='delete_default_guide_product'),
    path('delete/default-guide-products/', views.delete_default_guide_products, name='delete_default_guide_products'),
    path('remove/project/<str:projectId>/guide-product/<str:id>/', views.remove_guide_product_project, name='remove_guide_product_project'),
    # DOWNLOAD BACKUP
    path('download/backup/', views.download_mongo_db, name='download_mongo_db'),
    # GET FILE URL FROM AWS S3
    path('get-file-url/', views.get_default_file_url, name='get_file_url'),

] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
