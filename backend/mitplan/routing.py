from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/raid/(?P<room_name>\w+)/$', consumers.RaidConsumer.as_asgi()),
]