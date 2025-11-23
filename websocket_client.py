import asyncio
import websockets
import json

async def listen():
    uri = "ws://localhost:9222/devtools/page/BE04EC82B0943DD062211FED5195F7CD"
    async with websockets.connect(uri) as websocket:
        # Enable the console
        await websocket.send(json.dumps({"id": 1, "method": "Console.enable"}))
        while True:
            message = await websocket.recv()
            data = json.loads(message)
            if "method" in data and data["method"] == "Console.messageAdded":
                print(data["params"]["message"]["text"])

asyncio.run(listen())
