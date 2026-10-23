from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psutil
import socket
import subprocess
import requests
import json
import os
import feedparser
from bs4 import BeautifulSoup
from datetime import datetime
from fastapi.concurrency import run_in_threadpool
from monitors.rss_feed import get_rss_feed

from monitors.gpu import get_gpu_status
from monitors.comfyui import get_comfyui_queue_status
from monitors.services import get_services_status
from monitors.infrastructure import get_infra_status
from monitors.ai_ops import (
    get_ollama_models,
    generate_ai_insight,
    answer_ai_ops_question,
    generate_failure_prediction,
)

SETTINGS_FILE = "/path/to/ink-command-pro/backend/settings.json"

app = FastAPI(title="Ink Command Pro API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/status")
async def status():
    return {
        "host": socket.gethostname(),
        "timestamp": datetime.now().isoformat(),
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "ram_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage("/").percent,
        },
        "gpu": get_gpu_status(),
        "comfyui_queue": get_comfyui_queue_status(),
        "services": get_services_status(),
    }


@app.get("/infra")
async def infra():
    return get_infra_status()


@app.get("/ai/models")
async def ai_models():
    return get_ollama_models()


@app.get("/ai/insight")
async def ai_insight(model: str = "qwen2.5:7b"):
    return generate_ai_insight(model)


@app.post("/ai/ops")
async def ai_ops(payload: dict):
    model = payload.get("model", "qwen2.5:7b")
    question = payload.get("question", "")

    if not question:
        return {
            "status": "error",
            "answer": "質問が空です。",
            "model": model,
        }

    return await run_in_threadpool(
        answer_ai_ops_question,
        model,
        question,
    )


@app.get("/ai/predict")
async def ai_predict(model: str = "qwen2.5:7b"):
    return generate_failure_prediction(model)


@app.get("/rss")
async def rss():
    return await run_in_threadpool(get_rss_feed)

@app.post("/launch/ink-habit")
async def launch_ink_habit():
    import subprocess

    result = subprocess.run(
        ["pgrep", "-f", "inkhabit.AppImage"],
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
    )

    # 起動済みなら何もしない
    if result.stdout.strip():
        return {
            "status": "already_running",
            "app": "Ink Habit"
        }

    subprocess.Popen(
        ["/path/to/inkhabit.AppImage", "--no-sandbox"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    return {
        "status": "launched",
        "app": "Ink Habit"
    }

JELLYFIN_URL = "http://HOST_1_IP:8096"
JELLYFIN_API_KEY = "e6614c978a034945bcd51004e9f61404"
JELLYFIN_USER_ID = "21360f25e2dc4a60b429e345f151f359"


@app.get("/jellyfin/recent")
async def jellyfin_recent():
    response = requests.get(
        f"{JELLYFIN_URL}/Users/{JELLYFIN_USER_ID}/Items/Latest",
        params={
            "IncludeItemTypes": "Audio",
            "Limit": 20,
        },
        headers={
            "X-Emby-Token": JELLYFIN_API_KEY
        },
    )

    return response.json()

@app.get("/jellyfin/stream/{item_id}")
async def jellyfin_stream(item_id: str):
    return {
        "url": (
            f"{JELLYFIN_URL}/Audio/{item_id}/stream"
            f"?UserId={JELLYFIN_USER_ID}"
            f"&api_key={JELLYFIN_API_KEY}"
            f"&Static=true"
        )
    }

@app.get("/jellyfin/search")
async def jellyfin_search(q: str = ""):
    all_items = []
    start_index = 0
    limit = 500

    while True:
        response = requests.get(
            f"{JELLYFIN_URL}/Users/{JELLYFIN_USER_ID}/Items",
            params={
                "IncludeItemTypes": "Audio",
                "Recursive": "true",
                "StartIndex": start_index,
                "Limit": limit,
                "Fields": "Artists,Album,Genres,Tags,Path",
            },
            headers={
                "X-Emby-Token": JELLYFIN_API_KEY
            },
        )

        data = response.json()
        items = data.get("Items", [])
        all_items.extend(items)

        total = data.get("TotalRecordCount", len(all_items))

        if len(all_items) >= total or not items:
            break

        start_index += limit

    if not q:
        return {"Items": all_items[:30]}

    keyword = q.lower()
    filtered = []

    for item in all_items:
        name = item.get("Name", "")
        album = item.get("Album", "")
        artists = " ".join(item.get("Artists", []))
        album_artist = item.get("AlbumArtist", "")
        genres = " ".join(item.get("Genres", []))
        tags = " ".join(item.get("Tags", []))
        path = item.get("Path", "")

        haystack = f"{name} {album} {artists} {album_artist} {genres} {tags} {path}".lower()

        if keyword in haystack:
            filtered.append(item)

    return {
        "Items": filtered[:50],
        "TotalRecordCount": len(filtered),
    }

@app.post("/jellyfin/ai-dj")
async def jellyfin_ai_dj(payload: dict):
    prompt = payload.get("prompt", "")
    model = payload.get("model", "qwen2.5:3b")

    response = requests.get(
        f"{JELLYFIN_URL}/Users/{JELLYFIN_USER_ID}/Items",
        params={
            "IncludeItemTypes": "Audio",
            "Recursive": "true",
            "Limit": 30,
            "Fields": "Artists,Album,Genres,Tags",
        },
        headers={
            "X-Emby-Token": JELLYFIN_API_KEY
        },
    )

    items = response.json().get("Items", [])

    compact_items = []

    for item in items:
        if item.get("Type") != "Audio":
            continue

        compact_items.append({
    "name": item.get("Name"),
    "artist": ", ".join(item.get("Artists", [])),
})

    import json

    ollama_prompt = f"""
次の曲リストから、依頼に合う曲名を最大5曲だけ選んでください。

依頼:
{prompt}

曲リスト:
{json.dumps(compact_items, ensure_ascii=False)}

曲名だけを1行ずつ出力してください。
"""

    try:
        ollama_response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": ollama_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.2,
                    "num_predict": 80
                }
            },
            timeout=90,
        )

        text = ollama_response.json().get("response", "")

    except Exception as e:
        text = ""

    selected = []
    lower_text = text.lower()

    for item in items:
        name = item.get("Name", "")
        if name and name.lower() in lower_text:
            selected.append(item)

    if not selected:
        selected = items[:5]

    return {
        "prompt": prompt,
        "count": len(selected),
        "Items": selected,
    }

def load_settings():
    default_settings = {
        "rss_feeds": [],
        "podcast_feeds": [],
    }

    if not os.path.exists(SETTINGS_FILE):
        save_settings(default_settings)
        return default_settings

    try:
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        save_settings(default_settings)
        return default_settings

def save_settings(settings):
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)

    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(settings, f, ensure_ascii=False, indent=2)

def clean_html(text):
    if not text:
        return ""

    return BeautifulSoup(text, "html.parser").get_text(" ", strip=True)


@app.get("/feeds/settings")
async def get_feed_settings():
    return load_settings()


@app.post("/feeds/rss")
async def add_rss_feed(payload: dict):
    url = payload.get("url", "").strip()
    settings = load_settings()

    if url and url not in settings["rss_feeds"]:
        settings["rss_feeds"].append(url)
        save_settings(settings)

    return settings

@app.delete("/feeds/rss")
async def delete_rss_feed(payload: dict):
    url = payload.get("url", "").strip()
    settings = load_settings()

    settings["rss_feeds"] = [
        feed for feed in settings.get("rss_feeds", [])
        if feed != url
    ]

    save_settings(settings)
    return settings

@app.post("/feeds/podcast")
async def add_podcast_feed(payload: dict):
    url = payload.get("url", "").strip()
    settings = load_settings()

    if url and url not in settings["podcast_feeds"]:
        settings["podcast_feeds"].append(url)
        save_settings(settings)

    return settings


@app.delete("/feeds/podcast")
async def delete_podcast_feed(payload: dict):
    url = payload.get("url", "").strip()
    settings = load_settings()

    settings["podcast_feeds"] = [
        feed for feed in settings.get("podcast_feeds", [])
        if feed != url
    ]

    save_settings(settings)
    return settings


@app.get("/rss/custom")
async def custom_rss():
    settings = load_settings()
    items = []

    for feed_url in settings["rss_feeds"]:
        feed = feedparser.parse(feed_url)

        for entry in feed.entries[:20]:
            items.append({
                items.append({
    "source": feed.feed.get("title", feed_url),
    "title": entry.get("title", ""),
    "link": entry.get("link", ""),
    "summary": clean_html(entry.get("summary", "")),
    "published": entry.get("published", ""),
    "feed_url": feed_url,
})
            })

    return {
        "count": len(items),
        "items": items[:100],
    }


@app.get("/rss/search")
async def rss_search(q: str = ""):
    data = await custom_rss()
    keyword = q.lower().strip()

    if not keyword:
        return data

    results = []

    for item in data["items"]:
        haystack = f"{item['title']} {item['summary']} {item['source']}".lower()

        if keyword in haystack:
            results.append(item)

    return {
        "count": len(results),
        "items": results,
    }


@app.post("/rss/ai-search")
async def rss_ai_search(payload: dict):
    prompt = payload.get("prompt", "")
    model = payload.get("model", "qwen2.5:3b")

    data = await custom_rss()
    compact = data["items"][:40]

    ai_prompt = f"""
あなたはInk Commandの情報検索AIです。
次の記事一覧から、ユーザーの依頼に関係が深い記事を最大10件選んでください。

依頼:
{prompt}

記事一覧:
{json.dumps(compact, ensure_ascii=False)}

返答は記事タイトルだけを1行ずつ出してください。
"""

    try:
        res = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": ai_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.2,
                    "num_predict": 200,
                },
            },
            timeout=90,
        )

        text = res.json().get("response", "")
    except Exception:
        text = ""

    selected = []
    lower_text = text.lower()

    for item in compact:
        title = item.get("title", "")
        if title and title.lower() in lower_text:
            selected.append(item)

    if not selected:
        selected = compact[:5]

    return {
        "prompt": prompt,
        "count": len(selected),
        "items": selected,
    }


@app.post("/rss/summarize")
async def rss_summarize(payload: dict):
    title = payload.get("title", "")
    summary = payload.get("summary", "")
    model = payload.get("model", "qwen2.5:7b")

    prompt = f"""
次の記事情報を日本語でわかりやすく要約してください。

タイトル:
{title}

本文・概要:
{summary}

条件:
- 3〜5行
- 重要点を箇条書き
- 日本語
"""

    try:
        res = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "num_predict": 300,
                },
            },
            timeout=120,
        )

        text = res.json().get("response", "")
    except Exception:
        text = "要約に失敗しました。"

    return {
        "title": title,
        "summary_ja": text,
    }


@app.get("/podcast/episodes")
async def podcast_episodes():
    settings = load_settings()
    episodes = []

    for feed_url in settings["podcast_feeds"]:
        feed = feedparser.parse(feed_url)

        for entry in feed.entries[:30]:
            audio_url = ""

            for link in entry.get("links", []):
                if link.get("rel") == "enclosure":
                    audio_url = link.get("href", "")
                    break

            if not audio_url:
                continue

            episodes.append({
                "source": feed.feed.get("title", feed_url),
                "title": entry.get("title", ""),
                "summary": clean_html(entry.get("summary", "")),
                "published": entry.get("published", ""),
                "audioUrl": audio_url,
                "link": entry.get("link", ""),
                "feed_url": feed_url,
            })

    return {
        "count": len(episodes),
        "items": episodes[:100],
    }


@app.post("/podcast/ai-search")
async def podcast_ai_search(payload: dict):
    prompt = payload.get("prompt", "")
    model = payload.get("model", "qwen2.5:3b")

    data = await podcast_episodes()
    compact = data["items"][:40]

    ai_prompt = f"""
あなたはPodcast検索AIです。
次のPodcastエピソード一覧から、依頼に合うものを最大10件選んでください。

依頼:
{prompt}

エピソード一覧:
{json.dumps(compact, ensure_ascii=False)}

返答はエピソードタイトルだけを1行ずつ出してください。
"""

    try:
        res = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": ai_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.2,
                    "num_predict": 200,
                },
            },
            timeout=90,
        )

        text = res.json().get("response", "")
    except Exception:
        text = ""

    selected = []
    lower_text = text.lower()

    for item in compact:
        title = item.get("title", "")
        if title and title.lower() in lower_text:
            selected.append(item)

    if not selected:
        selected = compact[:5]

    return {
        "prompt": prompt,
        "count": len(selected),
        "items": selected,
    }
