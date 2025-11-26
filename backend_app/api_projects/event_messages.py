def message_project_default_material(msg_type, document):
    return {
        'type': 'project_default_material_update',
        'message': {
            'type': msg_type,
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "price": document.price,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "quantity": document.quantity,
                "isPackaged": document.is_packaged,
                "packageQuantity": document.package_quantity,
                "defaultGuideProducts": document.default_guide_products,
            }

        }
    }
    
def message_project_reminder(msg_type, document):
    return {
        'type': 'project_reminder_update',
        'message': {
            'type': msg_type,
            "item": {
                "id": str(document.id),
                "project": document.project,
                "projectDefaultTask": document.project_default_task,
                "userReporter": document.user_reporter,
                "notes": document.notes,
                "date": document.date,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "isActive": document.is_active,
            }

        }
    }
    
def message_project_default_guide_product(msg_type, document):
    return {
        'type': 'project_default_guide_product_update',
        'message': {
            'type': msg_type,
            "item": {
                "id": str(document.id),
                "name": document.name,
                "price": document.price,
                "description": document.description,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    
def message_project_stage(msg_type, document):
    return {
        'type': 'project_stage_update',
        'message': {
            'type': msg_type,
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "order": document.order,
                "otherName": document.other_name,
                "isActive": document.is_active,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    
def message_project_task_stage(msg_type, document):
    return {
        'type': 'project_task_stage_update',
        'message': {
            'type': msg_type,
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "isActive": document.is_active,
            }

        }
    }
    
def message_project(msg_type, document):
    return {
        'type': 'project_update',
        'message': {
            'type': msg_type,
            "item": {
                "id": str(document.id),
                "name": document.name,
                "number": document.number,
                "description": document.description,
                "referenceNumber": document.reference_number,
                "salesOrder": document.sales_order,
                "phone": document.phone,
                "lastModifiedTime": document.last_modified_time,
                "stageHistory": document.stage_history,
                "userReporter": document.user_reporter,
                "usersAssignees": document.users_assignees,
                "userInstaller": document.user_installer,
                "startDate": document.start_date,
                "endDate": document.end_date,
                "currentStage": document.current_stage,
                "projectAttachments": document.project_attachments,
                "projectTasks": document.project_tasks,
                "projectDefaultTasks": document.project_default_tasks,
                "projectComments": document.project_comments,
                "projectHistory": document.project_history,
                "address": document.address,
                "isActive": document.is_active,
                "hasPermission": document.has_permission,
                "userManager": document.user_manager,
                "allProductsMarked": document.all_products_marked,
                "allWindowsMarked": document.all_windows_marked,
                "allScrewMarked": document.all_screw_marked,
                "allTrashMarked": document.all_trash_marked,
                "feedback": document.feedback,
                "workScope": document.work_scope,
                "projectMaterials": document.project_materials,
                "projectGuideProducts": document.project_guide_products,
                "projectMaterialsOtherNotes": document.project_materials_other_notes,
                "inspectionDate": document.inspection_date,
                "inspectionEndDate": document.inspection_end_date,
                "inspectionDuration": document.inspection_duration,
                "inspectionIsPartDays": document.inspection_is_part_days,
                "finishPermissionDate": document.finish_permission_date,
                "finishPermissionEndDate": document.finish_permission_end_date,
                "finishPermissionDuration": document.finish_permission_duration,
                "finishPermissionIsPartDays": document.finish_permission_is_part_days,
                "isPartDays": document.is_part_days,
                "duration": document.duration,
                "workOrders": document.work_orders,
            }

        }
    }
    
def message_project_default_task(msg_type, document):
    return {
        'type': 'project_default_task_update',
        'message': {
            'type': msg_type,
            "item": {
                "id": str(document.id),
                "name": document.name,
                "number": document.number,
                "description": document.description,
                "order": document.order,
                "projectStage": document.project_stage,
                "projectStageStatus": document.project_stage_status,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "isActive": document.is_active,
                "hasAttachments": document.has_attachments,
            }

        }
    }
    
def message_project_tracking(msg_type, document):
    return {
        'type': 'project_tracking_update',
        'message': {
            'type': msg_type,
            "item": {
                "id": str(document.id),
                "userReporter": document.user_reporter,
                "action": document.action,
                "createdTime": document.created_time,
                "managedData": document.managed_data,
            }

        }
    }
    
def message_project_notification_user(msg_type, document):
    return {
        'type': 'project_notification_user_update',
        'message': {
            'type': msg_type,
            "item": {
                "id": str(document.id),
                "notification": document.notification,
                "username": document.username,
                "user": document.user,
                "read": document.read,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }

def message_project_calendar_notes(msg_type, document):
    return {
        'type': 'project_calendar_notes_update',
        'message': {
            'type': msg_type,
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "startDate": document.start_date,
                "endDate": document.end_date,
                "duration": document.duration,
                "userManager": document.user_manager,
                "userInstaller": document.user_installer,
                "userAssignees": document.user_assignees,
                "userReporter": document.user_reporter,
                "associatedEvents": document.associated_events,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    

def message_project_profit_report(msg_type, document):
    return {
        'type': 'project_profit_report_update',
        'message': {
            'type': msg_type,
            "item": {
                "id": str(document.id),
                "projectId": document.project_id,
                "projectInfo": document.project_info,
                "projectAmount": document.project_amount,
                "installationAmount": document.installation_amount,
                "installationCost": document.installation_cost,
                "installationProfit": document.installation_profit,
                "notes": document.notes,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }