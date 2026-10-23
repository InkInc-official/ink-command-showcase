import { useEffect, useState } from "react";

const API = "http://localhost:8765";

export default function RSSWidget() {
  const [rssFeeds, setRssFeeds] = useState([]);
  const [rssUrl, setRssUrl] = useState("");
  const [selectedFeed, setSelectedFeed] = useState("");
  const [articles, setArticles] = useState([]);
  const [selectedArticleLink, setSelectedArticleLink] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [status, setStatus] = useState("待機中");

  const loadSettings = async () => {
    const res = await fetch(`${API}/feeds/settings`);
    const data = await res.json();
    setRssFeeds(data.rss_feeds || []);
  };

  const loadArticles = async (feedUrl = selectedFeed) => {
    setStatus("読込中...");

    const res = await fetch(`${API}/rss/custom`);
    const data = await res.json();

    let items = data.items || [];

    if (feedUrl) {
      items = items.filter((item) => item.feed_url === feedUrl);
    }

    setArticles(items);
    setStatus(`${items.length}件`);
  };

  const addRssFeed = async () => {
    if (!rssUrl.trim()) return;

    await fetch(`${API}/feeds/rss`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: rssUrl }),
    });

    setRssUrl("");
    await loadSettings();
  };

  const deleteSelectedRssFeed = async () => {
    if (!selectedFeed) return;

    await fetch(`${API}/feeds/rss`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: selectedFeed }),
    });

    setSelectedFeed("");
    setSelectedArticleLink("");
    setArticles([]);

    await loadSettings();
  };

  const aiSearchArticles = async () => {
    if (!aiQuery.trim()) return;

    setStatus("AI検索中...");

    try {
      const res = await fetch(`${API}/rss/ai-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiQuery,
          model: "qwen2.5:3b",
        }),
      });

      if (!res.ok) {
        throw new Error(`AI search failed: ${res.status}`);
      }

      const data = await res.json();

      let items = data.items || [];

      if (selectedFeed) {
        items = items.filter((item) => item.feed_url === selectedFeed);
      }

      setArticles(items);
      setStatus(`AI ${items.length}件`);
    } catch (error) {
      console.warn("AI article search fallback:", error);

      const q = aiQuery.toLowerCase().trim();
      const fallback = articles.filter((item) => {
        const text = `${item.title || ""} ${item.summary || ""} ${item.source || ""}`.toLowerCase();
        return text.includes(q);
      });

      setArticles(fallback);
      setStatus(`ローカル検索 ${fallback.length}件`);
    }
  };

  const openSelectedArticle = () => {
    if (selectedArticleLink) {
      window.open(selectedArticleLink, "_blank");
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <section className="card rssCard">
      <div className="widgetHeader">
        <h2 className="widgetTitle">Ink RSS</h2>
        <span className="rssCount">{status}</span>
      </div>

      <div className="inkRadioSearch">
        <input
          value={rssUrl}
          onChange={(e) => setRssUrl(e.target.value)}
          placeholder="RSS URL"
        />
        <button onClick={addRssFeed}>追加</button>
      </div>

      <div className="inkRadioSearch">
        <select
          value={selectedFeed}
          onChange={(e) => {
            setSelectedFeed(e.target.value);
            setSelectedArticleLink("");
            loadArticles(e.target.value);
          }}
        >
          <option value="">RSSを選択</option>
          {rssFeeds.map((url) => (
            <option key={url} value={url}>
              {url}
            </option>
          ))}
        </select>
        <button onClick={deleteSelectedRssFeed}>削除</button>
      </div>

      <div className="inkRadioSearch">
        <select
          value={selectedArticleLink}
          onChange={(e) => setSelectedArticleLink(e.target.value)}
        >
          <option value="">記事を選択</option>
          {articles.map((item) => (
            <option key={item.link} value={item.link}>
              {item.title}
            </option>
          ))}
        </select>
        <button onClick={openSelectedArticle}>開く</button>
      </div>

      <div className="inkRadioSearch">
        <input
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          placeholder="AI 記事検索：例）ChatGPT"
        />
        <button onClick={aiSearchArticles}>AI</button>
      </div>
    </section>
  );
}