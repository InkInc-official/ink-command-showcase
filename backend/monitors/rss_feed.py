import time
import feedparser

RSS_CACHE = {
    "timestamp": 0,
    "data": None,
}

RSS_SOURCES = [
    {"name": "AIsmiley", "category": "AI", "url": "https://aismiley.co.jp/ai_news/feed/"},
    {"name": "AINOW", "category": "AI", "url": "https://ainow.ai/feed/"},
    {"name": "マイナビウーマン", "category": "Lifestyle", "url": "https://woman.mynavi.jp/feed/"},
    {"name": "GIGAZINE", "category": "Gadget", "url": "https://gigazine.net/news/rss_2.0/"},
    {"name": "ガルマックス", "category": "Gadget", "url": "https://garumax.com/feed"},
]


def get_rss_feed():
    now = time.time()

    if RSS_CACHE["data"] is not None and now - RSS_CACHE["timestamp"] < 1800:
        return RSS_CACHE["data"]

    items = []

    for source in RSS_SOURCES:
        try:
            feed = feedparser.parse(source["url"])

            for entry in feed.entries[:8]:
                items.append({
                    "source": source["name"],
                    "category": source["category"],
                    "title": entry.get("title", ""),
                    "link": entry.get("link", ""),
                    "published": entry.get("published", entry.get("updated", "")),
                })

        except Exception as e:
            items.append({
                "source": source["name"],
                "category": source["category"],
                "title": f"RSS取得エラー: {e}",
                "link": source["url"],
                "published": "",
            })

    result = {
        "status": "online",
        "count": len(items),
        "items": items[:25],
        "updated_at": now,
    }

    RSS_CACHE["timestamp"] = now
    RSS_CACHE["data"] = result

    return result