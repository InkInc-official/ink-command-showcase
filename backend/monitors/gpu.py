def get_gpu_status():
    return {
        "name": "Unsupported GPU monitor",
        "gpu_percent": None,
        "vram_percent": None,
        "vram_used_mb": None,
        "shared_used_mb": None,
        "vram_total_mb": None,
        "temperature": None,
        "status": "unknown",
    }
