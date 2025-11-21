# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Frontend (React/Vite)
- **Development**: `cd frontend_app && yarn dev` (runs on localhost:3030)
- **Build**: `cd frontend_app && yarn build`
- **Lint**: `cd frontend_app && yarn lint`
- **Lint Fix**: `cd frontend_app && yarn lint:fix`
- **Format Check**: `cd frontend_app && yarn fm:check`
- **Format Fix**: `cd frontend_app && yarn fm:fix`
- **Clean Restart**: `cd frontend_app && yarn re:start`

### Backend (Django)
- **Development**: `cd backend_app && python manage.py runserver`
- **Database Migrations**: `cd backend_app && python manage.py makemigrations && python manage.py migrate`
- **Collect Static**: `cd backend_app && python manage.py collectstatic`
- **Create Superuser**: `cd backend_app && python manage.py createsuperuser`
- **Run Celery Worker**: `cd backend_app && celery -A system_installation_project worker --loglevel=info`
- **Run Celery Beat**: `cd backend_app && celery -A system_installation_project beat --loglevel=info`

### Docker Services
- **Start All Services**: `docker-compose up -d`
- **Stop All Services**: `docker-compose down`
- **Rebuild Services**: `docker-compose up --build -d`
- **View Logs**: `docker-compose logs -f [service_name]`

### Database Access
- **MongoDB**: Access via MongoDB Compass on `mongodb://localhost:27037` or AdminMongo on `http://localhost:8082`
- **MongoExpress**: `http://localhost:8085`

## Architecture Overview

### Project Structure
This is a **full-stack installation project management system** with the following architecture:

#### Backend (Django + MongoDB)
- **Framework**: Django 5.1.4 with MongoEngine ODM
- **Database**: MongoDB with custom authentication backend
- **API**: GraphQL (Graphene-Django) and REST Framework
- **Authentication**: Custom JWT with MongoDB backend
- **Task Queue**: Celery with Redis broker
- **Real-time**: Django Channels with Redis

#### Frontend (React + Vite)
- **Framework**: React 18.3.1 with Vite build tool
- **UI Library**: Material-UI (MUI) 5.16.7
- **State Management**: Apollo Client for GraphQL, Tanstack Query
- **Authentication**: Auth0 integration
- **Rich Text**: TipTap editor
- **Charts**: ApexCharts, React-ApexCharts

### Core Application Modules

#### Backend Apps
1. **api_authorization**: Custom MongoDB authentication system
2. **api_projects**: Project management core (stages, tasks, work orders)
3. **api_services**: Service management and repair workflows
4. **api_measurements**: Measurement data handling
5. **api_integration**: External integrations (Zoho, AWS S3)
6. **api_projects_async_task_sequence**: Celery task automation
7. **api_users**: User management with role-based permissions

#### Frontend Sections
- **auth**: Authentication views (sign-in/up, password reset)
- **project**: Project management interfaces
- **calendar**: Scheduling and calendar views
- **file-manager**: Document and file management
- **dashboard**: Main analytics and overview

### Database Design
- **MongoDB Collections**: Uses MongoEngine Document models
- **Key Models**: ProjectStage, ProjectTaskStage, Project workflows
- **Authentication**: Custom user model with MongoDB backend
- **Indexing**: Performance indexes on frequently queried fields

### Environment Configuration
- **Backend**: Uses django-environ for environment variables
- **Docker**: Multi-service setup with MongoDB, Redis, Nginx
- **Networking**: Shared bridge network for service communication
- **Ports**: Frontend (3030), Backend (8001), MongoDB (27037), Redis (6399)

### Permission System
The application uses role-based access control with these roles:
- Superadmin, Administrator, Project Manager
- Installer, Service Staff, Warehouse Staff
- Permission checks via utility functions in `src/utils/check-permissions`

### Development Workflow
1. Backend changes require Django migrations if models are modified
2. Frontend uses Vite HMR for fast development
3. GraphQL schema changes need backend restart
4. Celery tasks for automated workflows run on schedule
5. Docker services can be developed independently

### Integration Points
- **AWS S3**: File storage for projects, tasks, services, comments, backups
- **Zoho**: CRM integration for sales orders
- **Auth0**: External authentication provider
- **Firebase**: Additional services integration

When working on this codebase:
- Always check user permissions before modifying access controls
- Follow the existing MongoDB document structure patterns
- Use the established GraphQL/REST API patterns
- Maintain the Docker service networking setup
- Test both authenticated and unauthenticated user flows