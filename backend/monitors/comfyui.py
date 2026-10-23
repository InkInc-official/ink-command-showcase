from requests import get
from config import COMFYUI_QUEUE_URL

def get_comfyui_queue_status():
    try:
        response = get(COMFYUI_QUEUE_URL, timeout=3)
        if response.status_code != 200:
            return {"status": "offline", "running": 0, "pending": 0}
        data = response.json()
        return {
            "status": "online",
            "running": len(data.get("queue_running", [])),
            "pending": len(data.get("queue_pending", [])),
        }
    except Exception:
        return {"status": "offline", "running": 0, "pending": 0}
