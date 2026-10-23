HOST_NAME = "HP-Slimline"

COMFYUI_URL = "http://127.0.0.1:8188"
COMFYUI_QUEUE_URL = "http://127.0.0.1:8188/queue"
OLLAMA_URL = "http://127.0.0.1:11434/api/tags"

INKFORMS_URL = "http://127.0.0.1:8000"
INKADMIN_URL = "http://127.0.0.1:8001"
NGROK_PROCESS_NAME = "ngrok"

MAIN_PC_STATUS_URL = "http://HOST_2_IP:8765/status"
MAGICNUC_STATUS_URL = "http://HOST_1_IP:8765/status"
SLIMLINE_STATUS_URL = "http://127.0.0.1:8765/status"
ACEPC_STATUS_URL = "http://HOST_3_IP:8765/status"
BOT_NUC_STATUS_URL = "http://HOST_4_IP:8765/status"

ACEPC_STORAGE_URL = "http://HOST_3_IP:8765/storage"
ACEPC_BACKUP_URL = "http://HOST_3_IP:8765/backup"
ACEPC_HEALTH_URL = "http://HOST_3_IP:8765/backup-node-health"

INFRA_TARGETS = [
    {"key": "hp_slimline", "name": "HP-Slimline", "ip": "HOST_5_IP", "role": "HUD / Development Node", "status_url": SLIMLINE_STATUS_URL},
    {"key": "main_pc", "name": "Main PC", "ip": "HOST_2_IP", "role": "Main Workstation", "status_url": MAIN_PC_STATUS_URL},
    {"key": "magicnuc", "name": "MAGICNUC", "ip": "HOST_1_IP", "role": "AI / ComfyUI / Media Node", "status_url": MAGICNUC_STATUS_URL},
    {"key": "acepc", "name": "Acepc Backup", "ip": "HOST_3_IP", "role": "Backup Node", "status_url": ACEPC_STATUS_URL},
    {"key": "bot_nuc", "name": "Bot NUC", "ip": "HOST_4_IP", "role": "Bot Node", "status_url": BOT_NUC_STATUS_URL},
]
