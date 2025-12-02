from channels.generic.websocket import AsyncWebsocketConsumer, AsyncJsonWebsocketConsumer
import json

######################################################
# PROJECT INSTALLATION CREW
######################################################

class ProjectInstallationCrewConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "project_installation_crew", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "project_installation_crew",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def project_installation_crew_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))

######################################################
# PROJECT PROFIT REPORT
######################################################

class ProjectProfitReportConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "project_profit_report", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "project_profit_report",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def project_profit_report_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))

######################################################
# PROJECT CALENDAR NOTES
######################################################

class ProjectCalendarNotesConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "project_calendar_notes", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "project_calendar_notes",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def project_calendar_notes_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))

######################################################
# PROJECT DEFAULT MATERIAL
######################################################

class ProjectDefaultMaterialConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "project_default_material", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "project_default_material",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def project_default_material_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))
        

######################################################
# PROJECT REMINDER
######################################################

class ProjectReminderConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "project_reminder", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "project_reminder",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def project_reminder_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))
        

######################################################
# PROJECT DEFAULT GUIDE PRODUCT
######################################################

class ProjectDefaultGuideProductConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "project_default_guide_product", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "project_default_guide_product",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def project_default_guide_product_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))
        
        
######################################################
# PROJECT STAGE
######################################################

class ProjectStageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "project_stage", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "project_stage",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def project_stage_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))
        
        
######################################################
# PROJECT TASK STAGE
######################################################
        
        
class ProjectTaskStageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "project_task_stage", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "project_task_stage",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def project_task_stage_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))
        
        
######################################################
# PROJECT
######################################################


class ProjectConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "project",  
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "project",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def project_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))
        

######################################################
# PROJECT DEFAULT TASK
######################################################


class ProjectDefaultTaskConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "project_default_task",  
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "project_default_task",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def project_default_task_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))
        
        
######################################################
# PROJECT BY ID
######################################################


class ProjectByIdConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.project_id = self.scope["url_route"]["kwargs"]["project_id"]
        self.group_name = f"project_{self.project_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send_json({
            "message": "Connected to project",
            "project_id": self.project_id,
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        pass

    async def project_update(self, event):
        await self.send_json(event["message"])
        
        
######################################################
# PROJECT NOTIFICATION USER
######################################################

class ProjectNotificationUserConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "project_notification_user", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "project_notification_user",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def project_notification_user_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))
        
        
######################################################
# PROJECT TRACKING
######################################################

class ProjectTrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "project_tracking", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "project_tracking",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def project_tracking_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))