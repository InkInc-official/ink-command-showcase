from datetime import datetime
from config import HOST_NAME
from monitors.system import get_system_status
from monitors.gpu import get_gpu_status
from monitors.comfyui import get_comfyui_queue_status
from monitors.services import get_services_status

def get_status_payload():
    return {
        "host": HOST_NAME,
        "timestamp": datetime.now().isoformat(),
        "system": get_system_status(),
        "gpu": get_gpu_status(),
        "comfyui_queue": get_comfyui_queue_status(),
        "services": get_services_status(),
    }
