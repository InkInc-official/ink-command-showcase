import psutil
from requests import get
from config import COMFYUI_URL, OLLAMA_URL, INKFORMS_URL, INKADMIN_URL, NGROK_PROCESS_NAME

def check_http_service(url):
    try:
        response = get(url, timeout=3)
        return "online" if response.status_code == 200 else "offline"
    except Exception:
        return "offline"

def check_process(name):
    for proc in psutil.process_iter(["name"]):
        try:
            if proc.info["name"] == name:
                return "online"
        except Exception:
            pass
    return "offline"

def get_services_status():
    return {
        "comfyui": check_http_service(COMFYUI_URL),
        "ollama": check_http_service(OLLAMA_URL),
        "ink_forms": check_http_service(INKFORMS_URL),
        "ink_admin": check_http_service(INKADMIN_URL),
        "ngrok": check_process(NGROK_PROCESS_NAME),
    }
