from channels.generic.websocket import AsyncWebsocketConsumer, AsyncJsonWebsocketConsumer
import json

######################################################
# SERVICE
######################################################

class ServiceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "service", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "service",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def service_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))
        
        
######################################################
# SERVICE BY ID
######################################################


class ServiceByIdConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.service_id = self.scope["url_route"]["kwargs"]["service_id"]
        self.group_name = f"service_{self.service_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send_json({
            "message": "Connected to service",
            "service_id": self.service_id,
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        pass

    async def service_update(self, event):
        await self.send_json(event["message"])
        

######################################################
# SERVICE ISSUE
######################################################

class ServiceIssueConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "service_issue", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "service_issue",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def service_issue_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))