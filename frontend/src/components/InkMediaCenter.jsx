import { useEffect, useRef, useState } from "react";

const API = "http://localhost:8765";

export default function InkMediaCenter() {
  const audioRef = useRef(null);

  const [rssQuery, setRssQuery] = useState("");
  const [rssAiQuery, setRssAiQuery] = useState("");
  const [rssItems, setRssItems] = useState([]);

  const [podcastQuery, setPodcastQuery] = useState("");
  const [podcastAiQuery, setPodcastAiQuery] = useState("");
  const [podcasts, setPodcasts] = useState([]);

  const [currentAudio, setCurrentAudio] = useState(null);

  async function loadRSS() {
    const res = await fetch(
      `${API}/rss/search?q=${encodeURIComponent(rssQuery)}`
    );

    const data = await res.json();
    setRssItems(data.items || []);
  }

  async function aiRSS() {
    const res = await fetch(`${API}/rss/ai-search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: rssAiQuery,
      }),
    });

    const data = await res.json();
    setRssItems(data.items || []);
  }

  async function loadPodcasts() {
    const res = await fetch(`${API}/podcast/episodes`);
    const data = await res.json();

    let items = data.items || [];

    if (podcastQuery.trim()) {
      const q = podcastQuery.toLowerCase();

      items = items.filter((x) => {
        const text =
          `${x.title} ${x.summary} ${x.source}`.toLowerCase();

        return text.includes(q);
      });
    }

    setPodcasts(items);
  }

  async function aiPodcast() {
    const res = await fetch(`${API}/podcast/ai-search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: podcastAiQuery,
      }),
    });

    const data = await res.json();
    setPodcasts(data.items || []);
  }

  function playAudio(item) {
    if (!audioRef.current) return;

    audioRef.current.src = item.audioUrl;
    audioRef.current.play();

    setCurrentAudio(item);
  }

  useEffect(() => {
    loadRSS();
    loadPodcasts();
  }, []);

  return (
    <div className="widgetCard">
      <h2>RSS & Podcast Center</h2>

      <div className="mediaSection">
        <h3>RSS</h3>

        <div className="mediaSearchRow">
          <input
            value={rssQuery}
            onChange={(e) => setRssQuery(e.target.value)}
            placeholder="RSS検索"
          />

          <button onClick={loadRSS}>
            検索
          </button>
        </div>

        <div className="mediaSearchRow">
          <input
            value={rssAiQuery}
            onChange={(e) => setRssAiQuery(e.target.value)}
            placeholder="AI検索：例）AIと心理"
          />

          <button onClick={aiRSS}>
            AI検索
          </button>
        </div>

        <div className="rssList">
          {rssItems.map((item, i) => (
            <div className="rssCard" key={i}>
              <div className="rssSource">
                {item.source}
              </div>

              <div className="rssTitle">
                {item.title}
              </div>

              <div className="rssSummary">
                {item.summary}
              </div>

              <button
                onClick={() => window.open(item.link)}
              >
                Operaで開く
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mediaSection">
        <h3>Podcast</h3>

        <div className="mediaSearchRow">
          <input
            value={podcastQuery}
            onChange={(e) =>
              setPodcastQuery(e.target.value)
            }
            placeholder="Podcast検索"
          />

          <button onClick={loadPodcasts}>
            検索
          </button>
        </div>

        <div className="mediaSearchRow">
          <input
            value={podcastAiQuery}
            onChange={(e) =>
              setPodcastAiQuery(e.target.value)
            }
            placeholder="AI検索：例）AIについて"
          />

          <button onClick={aiPodcast}>
            AI検索
          </button>
        </div>

        <div className="podcastPlayer">
          <audio
            controls
            ref={audioRef}
            style={{ width: "100%" }}
          />

          {currentAudio && (
            <div className="nowPlaying">
              {currentAudio.title}
            </div>
          )}
        </div>

        <div className="rssList">
          {podcasts.map((item, i) => (
            <div className="rssCard" key={i}>
              <div className="rssSource">
                {item.source}
              </div>

              <div className="rssTitle">
                {item.title}
              </div>

              <div className="rssSummary">
                {item.summary}
              </div>

              <button
                onClick={() => playAudio(item)}
              >
                ▶ 再生
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}