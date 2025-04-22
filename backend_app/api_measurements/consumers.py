from channels.generic.websocket import AsyncWebsocketConsumer, AsyncJsonWebsocketConsumer
import json

######################################################
# MEASUREMENT
######################################################

class MeasurementConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "measurement", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "meausrement",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def measurement_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))
        
        
######################################################
# MEASUREMENT BY ID
######################################################


class MeasurementByIdConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.measurement_id = self.scope["url_route"]["kwargs"]["measurement_id"]
        self.group_name = f"measurement_{self.measurement_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send_json({
            "message": "Connected to measurement",
            "measurement_id": self.measurement_id,
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        pass

    async def measurement_update(self, event):
        await self.send_json(event["message"])