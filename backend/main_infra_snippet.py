# If main.py currently hardcodes /infra, replace only the /infra section with this.

from monitors.infrastructure import get_infra_status

@app.get("/infra")
async def infra():
    return get_infra_status()
