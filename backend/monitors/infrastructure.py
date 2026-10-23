import platform
import re
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

from config import INFRA_TARGETS


def ping_node(ip):
    system = platform.system().lower()

    if "windows" in system:
        cmd = ["ping", "-n", "1", "-w", "1000", ip]
    else:
        cmd = ["ping", "-c", "1", "-W", "1", ip]

    started = time.time()

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=2,
        )

        elapsed_ms = int((time.time() - started) * 1000)

        if result.returncode != 0:
            return {
                "status": "offline",
                "latency": "N/A",
            }

        output = result.stdout + result.stderr
        match = re.search(r"time[=<]([0-9.]+)\s*ms", output)
        latency = f"{round(float(match.group(1)))} ms" if match else f"{elapsed_ms} ms"

        return {
            "status": "online",
            "latency": latency,
        }

    except Exception:
        return {
            "status": "offline",
            "latency": "N/A",
        }


def check_status_api(url):
    if not url:
        return {
            "api_status": "unknown",
        }

    try:
        response = requests.get(url, timeout=6)
        response.raise_for_status()

        return {
            "api_status": "online",
        }

    except Exception:
        return {
            "api_status": "offline",
        }


def check_target(target):
    if target.get("key") == "hp_slimline":
        return {
            "name": target["name"],
            "ip": target["ip"],
            "status": "online",
            "latency": "0 ms",
            "role": target.get("role", "HUD / Development Node"),
            "api_status": "local",
        }
    
    with ThreadPoolExecutor(max_workers=2) as executor:
        ping_future = executor.submit(ping_node, target["ip"])
        api_future = executor.submit(check_status_api, target.get("status_url"))

        try:
            ping = ping_future.result(timeout=3)
        except Exception:
            ping = {
                "status": "offline",
                "latency": "N/A",
            }

        try:
            status_api = api_future.result(timeout=8)
        except Exception:
            status_api = {
                "api_status": "timeout",
            }

    final_status = ping["status"]

    if status_api.get("api_status") == "online":
        final_status = "online"

    return {
        "name": target["name"],
        "ip": target["ip"],
        "status": final_status,
        "latency": ping["latency"],
        "role": target.get("role", "Node"),
        **status_api,
    }


def get_infra_status():
    result = {}

    with ThreadPoolExecutor(max_workers=8) as executor:
        future_map = {}

        for target in INFRA_TARGETS:
            key = target.get("key") or target["name"].lower().replace(" ", "_")
            future = executor.submit(check_target, target)
            future_map[future] = key

        try:
            for future in as_completed(future_map, timeout=12):
                key = future_map[future]
                try:
                    result[key] = future.result()
                except Exception:
                    result[key] = {
                        "name": key,
                        "ip": "unknown",
                        "status": "offline",
                        "latency": "N/A",
                        "role": "Node",
                        "api_status": "offline",
                    }
        except Exception:
            pass

    for target in INFRA_TARGETS:
        key = target.get("key") or target["name"].lower().replace(" ", "_")
        if key not in result:
            result[key] = {
                "name": target["name"],
                "ip": target["ip"],
                "status": "timeout",
                "latency": "N/A",
                "role": target.get("role", "Node"),
                "api_status": "timeout",
            }

    return result
