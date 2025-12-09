from api_projects.models import Project

def sync_project_update_info(projects, tracking_info, id):
    for project in projects:
        has_change = False
        if project.user_reporter and str(project.user_reporter.get('id', '')) == id:
            tracking_info['avatar_url'] = project.user_reporter['avatarUrl'] if project.user_reporter.get('avatarUrl') else \
                                          project.user_reporter['avatar_url'] if project.user_reporter.get('avatar_url') else None  
            project.user_reporter = tracking_info
            has_change = True
        if project.user_manager is not None:
            if str(project.user_manager.get('id', '')) == id:
                tracking_info['avatar_url'] = project.user_manager['avatarUrl'] if project.user_manager.get('avatarUrl') else \
                                            project.user_manager['avatar_url'] if project.user_manager.get('avatar_url') else None
                new_info = {
                    **project.user_manager, 
                    'firstName': tracking_info['first_name'],
                    'lastName': tracking_info['last_name'],
                    'avatarUrl': tracking_info['avatar_url'],
                    'email': tracking_info['email'],
                    'phoneNumber': tracking_info['phone_number'],
                    'name': f"{tracking_info['first_name']} {tracking_info['last_name']}",
                    'installerInfo': tracking_info.get('installer_info', {})
                }                              
                project.user_manager = new_info
                has_change = True
        current_assignee = next((assignee for assignee in (project.users_assignees or []) if str(assignee['id']) == id), None)
        if current_assignee:
            user_assignees = [assignee for assignee in (project.users_assignees or []) if str(assignee['id']) != id]
            user_assignees.append({
                    **current_assignee,
                    'id': tracking_info['id'],
                    'username': tracking_info['username'],
                    'firstName': tracking_info['first_name'],
                    'lastName': tracking_info['last_name'],
                    'avatarUrl': tracking_info['avatar_url'],
                    'email': tracking_info['email'],
                    'phoneNumber': tracking_info['phone_number'],
                    'name': f"{tracking_info['first_name']} {tracking_info['last_name']}",
                    'installerInfo': tracking_info.get('installer_info', {})
            })
            user_assignees = sorted(user_assignees, key=lambda x: x['username'], reverse=True)
            project.users_assignees = user_assignees
            has_change = True
        default_tasks = project.project_default_tasks or []
        for default_task in default_tasks:
            current_user_assignees = next((assignee for assignee in (default_task['users_assignees'] or []) if str(assignee['id']) == id), None)
            if current_user_assignees:
                task_user_assignees = [assignee for assignee in (default_task['users_assignees'] or []) if str(assignee['id']) != id]
                task_user_assignees.append({
                    **current_user_assignees,
                    'id': tracking_info['id'],
                    'username': tracking_info['username'],
                    'firstName': tracking_info['first_name'],
                    'lastName': tracking_info['last_name'],
                    'avatarUrl': tracking_info['avatar_url'],
                    'email': tracking_info['email'],
                    'phoneNumber': tracking_info['phone_number'],
                    'name': f"{tracking_info['first_name']} {tracking_info['last_name']}",
                    'installerInfo': tracking_info.get('installer_info', {})
                })
                task_user_assignees = sorted(task_user_assignees, key=lambda x: x['username'], reverse=True)
                default_task['users_assignees'] = task_user_assignees
                has_change = True
        if project.user_installer and str(project.user_installer.get('id', '')) == id:
            tracking_info['avatar_url'] = project.user_installer['avatarUrl'] if project.user_installer.get('avatarUrl') else \
                                          project.user_installer['avatar_url'] if project.user_installer.get('avatar_url') else None  
            project.user_installer = tracking_info
            has_change = True
        
        work_orders = project.work_orders or []
        for work_order in work_orders:
            current_assignee = next((assignee for assignee in (work_order.get('users_assignees', []) or []) if str(assignee['id']) == id), None)
            if current_assignee:
                user_assignees = [assignee for assignee in (work_order.get('users_assignees', []) or []) if str(assignee['id']) != id]
                user_assignees.append({
                        **current_assignee,
                        'id': tracking_info['id'],
                        'username': tracking_info['username'],
                        'firstName': tracking_info['first_name'],
                        'lastName': tracking_info['last_name'],
                        'avatarUrl': tracking_info['avatar_url'],
                        'email': tracking_info['email'],
                        'phoneNumber': tracking_info['phone_number'],
                        'name': f"{tracking_info['first_name']} {tracking_info['last_name']}",
                        'installerInfo': tracking_info.get('installer_info', {})
                })
                user_assignees = sorted(user_assignees, key=lambda x: x['username'], reverse=True)
                work_order['users_assignees'] = user_assignees
                has_change = True
            
        if has_change:
            project.save()