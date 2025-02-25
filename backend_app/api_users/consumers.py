from channels.generic.websocket import AsyncWebsocketConsumer, AsyncJsonWebsocketConsumer
import json

##########################################################################
# UserRole
##########################################################################

class UserRoleConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "user_role", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "user_role",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def user_role_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))
        
        
##########################################################################
# User
##########################################################################

class UserConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "user", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "user",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def user_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))