import json
from datetime import datetime

import requests


OLLAMA_GENERATE_URL = "http://127.0.0.1:11434/api/generate"
OLLAMA_TAGS_URL = "http://127.0.0.1:11434/api/tags"

MAIN_PC_STATUS_URL = "http://HOST_2_IP:8765/status"
MAGICNUC_STATUS_URL = "http://HOST_1_IP:8765/status"
ACEPC_STATUS_URL = "http://HOST_3_IP:8765/status"
ACEPC_STORAGE_URL = "http://HOST_3_IP:8765/storage"
ACEPC_BACKUP_URL = "http://HOST_3_IP:8765/backup"
ACEPC_HEALTH_URL = "http://HOST_3_IP:8765/backup-node-health"
BOT_NUC_STATUS_URL = "http://HOST_4_IP:8765/status"
LOCAL_INFRA_URL = "http://127.0.0.1:8765/infra"


def get_ollama_models():
    try:
        response = requests.get(OLLAMA_TAGS_URL, timeout=8)
        response.raise_for_status()
        data = response.json()
        models = [item.get("name") for item in data.get("models", []) if item.get("name")]
        return {"status": "ok", "models": models}
    except Exception as e:
        return {"status": "error", "models": [], "error": str(e)}


def safe_get_json(name, url, timeout=20):
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        return {"name": name, "status": "online", "data": response.json()}
    except Exception as e:
        return {"name": name, "status": "offline", "error": str(e)}


def compact_node(item):
    data = item.get("data") or {}
    system = data.get("system") or {}
    host = data.get("host", item.get("name"))
    services = data.get("services", {})

    KNOWN_DISABLED = {
        "LAPTOP-HPLG0VP0": [
            "comfyui",
            "ollama",
            "ink_forms",
            "ink_admin",
            "ngrok",
        ],
        "acepc": [
            "comfyui",
            "ollama",
            "ink_forms",
            "ink_admin",
            "ngrok",
        ],
    }

    ignored = KNOWN_DISABLED.get(host, [])

    filtered_services = {}

    for key, value in services.items():
        if key in ignored:
            continue
        filtered_services[key] = value

    return {
        "status": item.get("status"),
        "host": data.get("host", item.get("name")),
        "cpu": system.get("cpu_percent"),
        "ram": system.get("ram_percent"),
        "disk": system.get("disk_percent"),
        "services": filtered_services,
    }


def compact_acepc_health(item):
    data = item.get("data") or {}
    risk = data.get("risk") or {}
    system_disk = data.get("system_disk") or {}
    backup_disk = data.get("backup_disk") or {}
    mount_guard = data.get("mount_guard") or {}
    wrong_location = data.get("wrong_location") or {}
    syncthing = data.get("syncthing") or {}
    io_errors = data.get("io_errors") or {}
    backup_folders = data.get("backup_folders") or {}
    groups = backup_folders.get("groups") or {}

    folder_summary = {}
    for group_name, group in groups.items():
        folder_summary[group_name] = {
            "status": group.get("status"),
            "method": group.get("method"),
            "total_size_gb": group.get("total_size_gb"),
            "missing_count": group.get("missing_count"),
        }

    return {
        "status": item.get("status"),
        "risk_level": risk.get("level"),
        "warnings": risk.get("warnings", []),
        "root_disk_percent": system_disk.get("percent"),
        "root_disk_risk": system_disk.get("risk"),
        "backup_disk_percent": backup_disk.get("percent"),
        "backup_disk_free_gb": backup_disk.get("free_gb"),
        "mount_guard": mount_guard.get("status"),
        "wrong_location": wrong_location.get("status"),
        "wrong_location_items": len(wrong_location.get("items", [])),
        "syncthing_status": syncthing.get("status"),
        "syncthing_memory_mb": syncthing.get("memory_mb"),
        "syncthing_risk": syncthing.get("risk"),
        "io_status": io_errors.get("status"),
        "io_risk": io_errors.get("risk"),
        "io_last_error": io_errors.get("last_error"),
        "backup_folders": folder_summary,
    }


def collect_ops_snapshot():
    main_pc = safe_get_json("Main PC", MAIN_PC_STATUS_URL)
    magicnuc = safe_get_json("MAGICNUC", MAGICNUC_STATUS_URL)
    acepc = safe_get_json("Acepc Backup", ACEPC_STATUS_URL)
    bot_nuc = safe_get_json("Bot NUC", BOT_NUC_STATUS_URL)
    acepc_storage = safe_get_json("Acepc Storage", ACEPC_STORAGE_URL)
    acepc_backup = safe_get_json("Acepc Backup Status", ACEPC_BACKUP_URL)
    acepc_health = safe_get_json("Acepc Health", ACEPC_HEALTH_URL)
    infra = safe_get_json("Infrastructure", LOCAL_INFRA_URL)

    return {
        "timestamp": datetime.now().isoformat(),
        "nodes": {
            "main_pc": compact_node(main_pc),
            "magicnuc": compact_node(magicnuc),
            "acepc": compact_node(acepc),
            "bot_nuc": compact_node(bot_nuc),
        },
        "acepc_health": compact_acepc_health(acepc_health),
        "storage": {
            "status": acepc_storage.get("status"),
            "percent": (acepc_storage.get("data") or {}).get("percent"),
            "free_gb": (acepc_storage.get("data") or {}).get("free_gb"),
        },
        "backup": {
            "status": acepc_backup.get("status"),
            "last_backup": (acepc_backup.get("data") or {}).get("last_backup"),
            "mode": (acepc_backup.get("data") or {}).get("mode"),
        },
        "infrastructure": {
            "status": infra.get("status"),
            "data": infra.get("data", {}),
        },
    }


def call_ollama(model, prompt, temperature=0.1):
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": 80,
            "num_ctx": 768,
        },
    }
    response = requests.post(OLLAMA_GENERATE_URL, json=payload, timeout=45)
    response.raise_for_status()
    return response.json().get("response", "").strip()


def snapshot_text(snapshot):
    return json.dumps(snapshot, ensure_ascii=False, indent=2)


def generate_ai_insight(model):
    return {
        "status": "ok",
        "model": "rule-based-fast",
        "insight": "概ね安定。Acepc・MAGICNUC・Bot NUCはオンライン監視中です。",
        "snapshot": {
            "mode": "fast_rule_based",
        },
    }


def answer_ai_ops_question(model, question):
    snapshot = collect_ops_snapshot()

    risks = []
    actions = []

    nodes = snapshot.get("nodes", {})
    storage = snapshot.get("storage", {})
    backup = snapshot.get("backup", {})

    for key, node in nodes.items():
        name = node.get("host") or key
        status = node.get("status")
        cpu = node.get("cpu")
        ram = node.get("ram")
        disk = node.get("disk")

        if status != "online":
            risks.append(f"{name} が取得できていません。")
            actions.append(f"{name} のTailscaleまたはAPIを確認してください。")

        if disk is not None and disk >= 85:
            risks.append(f"{name} のDisk使用率が高いです（{disk}%）。")
            actions.append(f"{name} の不要ファイル整理をしてください。")

        if ram is not None and ram >= 85:
            risks.append(f"{name} のRAM使用率が高いです（{ram}%）。")

        if cpu is not None and cpu >= 90:
            risks.append(f"{name} のCPU使用率が高いです（{cpu}%）。")

    if storage.get("percent") is not None and storage.get("percent") >= 85:
        risks.append(f"Acepc外付けBackup HDDの使用率が高いです（{storage.get('percent')}%）。")
        actions.append("AcepcのBackup HDD容量を確認してください。")

    if backup.get("status") != "online":
        risks.append("Backup Statusが取得できていません。")
        actions.append("Acepcのbackup APIを確認してください。")

    if risks:
        answer = (
            "このデータ上では、注意点があります。\n"
            + "\n".join(f"- {risk}" for risk in risks[:3])
            + "\n次アクション: "
            + (actions[0] if actions else "該当ノードを確認してください。")
        )
    else:
        answer = (
            "このデータ上では、重大リスクは低いです。\n"
            "全ノードのCPU/RAM/DiskとBackup状態は概ね安定しています。\n"
            "次アクション: Acepc Backup Node HealthとStorage容量を定期確認してください。"
        )

    return {
        "status": "ok",
        "model": "rule-based-ops",
        "answer": answer,
        "snapshot": snapshot,
    }


from monitors.infrastructure import get_infra_status


def generate_failure_prediction(model):
    infra = get_infra_status()

    high_risks = []
    mid_risks = []
    low_risks = []
    actions = []

    for key, node in infra.items():
        name = node.get("name", key)
        status = node.get("status")
        api_status = node.get("api_status")
        system = node.get("system") or {}

        if status != "online":
            high_risks.append(f"{name} が読み込めていません。")
            actions.append(f"{name} の電源、Tailscale、backend APIを確認してください。")
            continue

        if api_status not in [None, "online", "unknown"]:
            mid_risks.append(f"{name} のAPI応答が不安定です。")
            actions.append(f"{name} の 8765/status を確認してください。")

        cpu = system.get("cpu_percent")
        ram = system.get("ram_percent")
        disk = system.get("disk_percent")

        if cpu is not None and cpu >= 90:
            mid_risks.append(f"{name} のCPU使用率が高いです（{cpu}%）。")

        if ram is not None and ram >= 85:
            mid_risks.append(f"{name} のRAM使用率が高いです（{ram}%）。")

        if disk is not None and disk >= 85:
            high_risks.append(f"{name} のDisk使用率が危険域です（{disk}%）。")
            actions.append(f"{name} の不要ファイル削除またはバックアップ整理をしてください。")

    if high_risks:
        prediction = (
            "高リスクがあります。\n"
            + "\n".join(f"- {x}" for x in high_risks)
            + "\n\n次アクション: "
            + (actions[0] if actions else "該当ノードを確認してください。")
        )
        status = "warning"

    elif mid_risks:
        prediction = (
            "中リスクがあります。\n"
            + "\n".join(f"- {x}" for x in mid_risks)
            + "\n\n次アクション: "
            + (actions[0] if actions else "該当ノードを確認してください。")
        )
        status = "warning"

    else:
        prediction = (
            "全ノードが概ね安定しています。\n"
            "重大な監視異常は検出されていません。"
        )
        status = "ok"

    return {
        "status": status,
        "model": "rule-based-monitor",
        "prediction": prediction,
        "snapshot": {
            "mode": "infra_check",
            "high_risks": high_risks,
            "mid_risks": mid_risks,
            "low_risks": low_risks,
        },
    }