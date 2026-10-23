import { useEffect, useMemo, useRef, useState } from "react";

const API = "http://localhost:8765";

const formatTime = (sec) => {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

export default function InkRadioWidget() {
  const [recent, setRecent] = useState([]);
  const [results, setResults] = useState([]);
  const [queue, setQueue] = useState([]);
  const [query, setQuery] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [nowPlaying, setNowPlaying] = useState(null);
  const [mode, setMode] = useState("最近追加");
  const [autoPlay, setAutoPlay] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState("all"); // off / all / one
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [radioStatus, setRadioStatus] = useState("待機中");
  const [podcastFeeds, setPodcastFeeds] = useState([]);
  const [selectedPodcastFeed, setSelectedPodcastFeed] = useState("");
  const [podcastEpisodes, setPodcastEpisodes] = useState([]);
  const [podcastQuery, setPodcastQuery] = useState("");
  const [podcastAiQuery, setPodcastAiQuery] = useState("");
  const [podcastFeedUrl, setPodcastFeedUrl] = useState("");
  const [selectedEpisodeUrl, setSelectedEpisodeUrl] = useState("");

  const audioRef = useRef(null);

  useEffect(() => {
  loadRecent();
  setRadioStatus("待機中");
}, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  const audioItems = useMemo(() => {
  return results.filter((item) => item.Type === "Audio");
}, [results]);

  const loadRecent = async () => {
    setMode("最近追加");
    setResults([]);
    const res = await fetch(`${API}/jellyfin/recent`);
    const data = await res.json();
    const audio = Array.isArray(data) ? data.filter((item) => item.Type === "Audio") : [];
    setRecent(audio);
    setQueue(audio);
  };

  const deleteSelectedPodcastFeed = async () => {
  if (!selectedPodcastFeed) return;

  await fetch(`${API}/feeds/podcast`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: selectedPodcastFeed,
    }),
  });

  setSelectedPodcastFeed("");
  setPodcastEpisodes([]);
  setSelectedEpisodeUrl("");

  await loadPodcastSettings();
};

  const search = async (word = query) => {
  if (!word.trim()) return;

  try {
    setRadioStatus("検索中...");

    setMode(`検索: ${word}`);

    const res = await fetch(
      `${API}/jellyfin/search?q=${encodeURIComponent(word)}`
    );

    const data = await res.json();

    const items = data.Items || [];
    const audio = items.filter((item) => item.Type === "Audio");

    setResults(items);
    setQueue(audio);

    setRadioStatus(
      audio.length > 0
        ? `${audio.length}件`
        : "結果なし"
    );
  } catch (e) {
    console.error(e);
    setRadioStatus("検索失敗");
  }
};

  const playItem = async (item, list = queue) => {
  try {
    setRadioStatus("再生準備中...");

    let url = item.audioUrl;

    if (!url && item.Id) {
      const res = await fetch(`${API}/jellyfin/stream/${item.Id}`);
      const data = await res.json();
      url = data.url;
    }

    if (!url) {
      setRadioStatus("再生URLなし");
      return;
    }

    setNowPlaying(item);
    if (list.length > 0) setQueue(list);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.load();
      await audioRef.current.play();

      setIsPlaying(true);
      setRadioStatus("再生中");
    }
  } catch (e) {
    console.error(e);
    setRadioStatus("再生失敗");
  }
};

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (!nowPlaying && audioItems[0]) {
      await playItem(audioItems[0], audioItems);
      return;
    }

    if (audioRef.current.paused) {
      await audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  const playNext = async () => {
    const list = queue.length > 0 ? queue : audioItems;
    if (!list.length) return;

    if (!nowPlaying) {
      const first = shuffle ? shuffleArray(list)[0] : list[0];
      await playItem(first, list);
      return;
    }

    const currentIndex = list.findIndex((item) => item.Id === nowPlaying.Id);
    let nextItem;

    if (shuffle) {
      nextItem = shuffleArray(list.filter((item) => item.Id !== nowPlaying.Id))[0] || list[0];
    } else {
      nextItem = list[currentIndex + 1] || list[0];
    }

    await playItem(nextItem, list);
  };

  const playPrev = async () => {
    const list = queue.length > 0 ? queue : audioItems;
    if (!list.length) return;

    const currentIndex = list.findIndex((item) => item.Id === nowPlaying?.Id);
    const prevItem = list[currentIndex - 1] || list[list.length - 1];

    await playItem(prevItem, list);
  };

  const seek = (seconds) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + seconds)
    );
  };

  const handleEnded = async () => {
    if (repeatMode === "one") {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      return;
    }

    if (autoPlay || repeatMode === "all") {
      await playNext();
    } else {
      setIsPlaying(false);
    }
  };

  const playShuffle = async () => {
    const list = audioItems.length > 0 ? audioItems : recent;
    const shuffled = shuffleArray(list);
    setShuffle(true);
    setQueue(shuffled);
    if (shuffled[0]) await playItem(shuffled[0], shuffled);
  };

  const aiDjPrompt = async () => {
  if (!aiPrompt.trim()) return;

  try {
    setRadioStatus("AI DJ選曲中...");
    setMode(`AI DJ: ${aiPrompt}`);

    const res = await fetch(`${API}/jellyfin/ai-dj`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: aiPrompt,
        model: "qwen2.5:3b",
      }),
    });

    const data = await res.json();
    const audio = data.Items || [];

    setResults(audio);
    setQueue(audio);

    setRadioStatus(
      audio.length > 0 ? `AI DJ ${audio.length}曲` : "候補なし"
    );

    if (audio[0]) {
      await playItem(audio[0], audio);
    }
  } catch (e) {
    console.error(e);
    setRadioStatus("AI DJ失敗");
  }
};

  const addPodcastFeed = async () => {
  if (!podcastFeedUrl.trim()) return;

  await fetch(`${API}/feeds/podcast`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: podcastFeedUrl,
    }),
  });

  setPodcastFeedUrl("");

  await loadPodcastSettings();
  await loadPodcastEpisodes();
};

const loadPodcastSettings = async () => {
  const res = await fetch(`${API}/feeds/settings`);
  const data = await res.json();

  setPodcastFeeds(data.podcast_feeds || []);
};

const loadPodcastEpisodes = async (feedUrl = selectedPodcastFeed) => {
  const res = await fetch(`${API}/podcast/episodes`);
  const data = await res.json();

  let items = data.items || [];

  if (feedUrl) {
    items = items.filter((item) => item.feed_url === feedUrl);
  }

  setPodcastEpisodes(items);
};

const searchPodcast = async () => {
  await loadPodcastEpisodes(selectedPodcastFeed);

  const q = podcastQuery.toLowerCase().trim();
  if (!q) return;

  setPodcastEpisodes((prev) =>
    prev.filter((item) =>
      `${item.title} ${item.summary} ${item.source}`.toLowerCase().includes(q)
    )
  );
};

const aiSearchPodcast = async () => {
  setRadioStatus("Podcast AI検索中...");

  const res = await fetch(`${API}/podcast/ai-search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: podcastAiQuery,
      model: "qwen2.5:3b",
    }),
  });

  const data = await res.json();

  let items = data.items || [];

  if (selectedPodcastFeed) {
  items = items.filter((item) => item.feed_url === selectedPodcastFeed);
}

setPodcastEpisodes(items);
setRadioStatus(`${items.length}件`);
};

  const toggleRepeat = () => {
    setRepeatMode((current) => {
      if (current === "off") return "all";
      if (current === "all") return "one";
      return "off";
    });
  };

  return (
    
    <section className="card">
      <div className="widgetHeader">
        <h2 className="widgetTitle">Ink Radio</h2>
        <span
  className={`radioStatus ${
    radioStatus.includes("中")
      ? "loading"
      : radioStatus.includes("完了")
        ? "success"
        : ""
  }`}
>
  {radioStatus}
</span>
      </div>

      <div className="inkRadioNow">
        <strong>Now Playing</strong>
        <div>{nowPlaying ? nowPlaying.Name : "未再生"}</div>
        <small>{nowPlaying?.Artists?.join(", ") || nowPlaying?.Album || ""}</small>
      </div>

      <audio
        ref={audioRef}
        onEnded={handleEnded}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="inkCustomPlayer">
  <div className="radioPlayerTop">
    <button className="radioIconBtn" onClick={() => setShuffle(!shuffle)} title="シャッフル">
      <img
        className={!shuffle ? "iconDisabled" : ""}
        src="/icons/radio/shuffle.png"
        alt="shuffle"
      />
    </button>

    <button className="radioIconBtn" onClick={playPrev} title="前の曲">
      <img src="/icons/radio/prev.png" alt="prev" />
    </button>

    <button className="radioIconBtn" onClick={() => seek(-10)} title="10秒戻る">
      <img src="/icons/radio/seek-back.png" alt="back" />
    </button>

    <button className="radioIconBtn mainPlay" onClick={togglePlay} title="再生/一時停止">
      <img src={isPlaying ? "/icons/radio/pause.png" : "/icons/radio/play.png"} alt="play" />
    </button>

    <button className="radioIconBtn" onClick={stop} title="停止">
      <img src="/icons/radio/stop.png" alt="stop" />
    </button>

    <button className="radioIconBtn" onClick={() => seek(10)} title="10秒進む">
      <img src="/icons/radio/seek-forward.png" alt="forward" />
    </button>

    <button className="radioIconBtn" onClick={playNext} title="次の曲">
      <img src="/icons/radio/next.png" alt="next" />
    </button>

    <button className="radioIconBtn" onClick={toggleRepeat} title="リピート">
      <img
        src={
          repeatMode === "off"
            ? "/icons/radio/repeat-off.png"
            : repeatMode === "one"
              ? "/icons/radio/repeat-one.png"
              : "/icons/radio/repeat-all.png"
        }
        alt="repeat"
      />
    </button>

    <button className="radioIconBtn" onClick={() => setMuted(!muted)} title="ミュート">
      <img
        src={
          muted
            ? "/icons/radio/mute.png"
            : isPlaying
              ? "/icons/radio/volume.png"
              : "/icons/radio/mute-off.png"
        }
        alt="volume"
      />
    </button>
  </div>

  <div className="radioPlayerBottom">
    <div className="radioTime">
      {formatTime(currentTime)} / {formatTime(duration)}
    </div>

    <input
      className="radioSeek"
      type="range"
      min="0"
      max={duration || 0}
      value={currentTime}
      onChange={(e) => {
        if (audioRef.current) audioRef.current.currentTime = Number(e.target.value);
      }}
    />
  </div>
</div>

<div className="inkRadioSearch">
  <input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="曲名・アーティスト検索"
    onKeyDown={(e) => {
      if (e.key === "Enter") search();
    }}
  />
  <button onClick={() => search()}>検索</button>
</div>

<div className="inkRadioSearch">
  <input
    value={aiPrompt}
    onChange={(e) => setAiPrompt(e.target.value)}
    placeholder="AIで曲検索：例）夜っぽい曲、配信用"
  />
  <button onClick={aiDjPrompt}>AI</button>
</div>

<div className="inkRadioList">
  {audioItems.map((item) => (
    <button
      key={item.Id}
      className="inkRadioItem"
      onClick={() => playItem(item, audioItems)}
    >
      <span>▶</span>
      <div>
        <strong>{item.Name}</strong>
        <small>{item.Artists?.join(", ") || item.Album || "Unknown"}</small>
      </div>
    </button>
  ))}
</div>

      <div className="inkRadioSearch">
  <input
    value={podcastFeedUrl}
    onChange={(e) => setPodcastFeedUrl(e.target.value)}
    placeholder="Podcast RSS URL"
  />
  <button onClick={addPodcastFeed}>追加</button>
</div>

<div className="inkRadioSearch">
  <select
    value={selectedPodcastFeed}
    onChange={(e) => {
      setSelectedPodcastFeed(e.target.value);
      loadPodcastEpisodes(e.target.value);
    }}
  >
    <option value="">Podcastを選択</option>
    {podcastFeeds.map((url) => (
      <option key={url} value={url}>
        {url}
      </option>
    ))}
  </select>
  <button onClick={deleteSelectedPodcastFeed}>削除</button>
</div>

<div className="inkRadioSearch">
  <select
    value={selectedEpisodeUrl}
    onChange={(e) => {
      const episode = podcastEpisodes.find(
        (item) => item.audioUrl === e.target.value
      );
      if (episode) playItem(episode, podcastEpisodes);
      setSelectedEpisodeUrl(e.target.value);
    }}
  >
    <option value="">エピソードを選択</option>
    {podcastEpisodes.map((item) => (
      <option key={item.audioUrl} value={item.audioUrl}>
        {item.title}
      </option>
    ))}
  </select>
</div>

<div className="inkRadioSearch">
  <input
    value={podcastQuery}
    onChange={(e) => setPodcastQuery(e.target.value)}
    placeholder="Podcastエピソード検索"
    onKeyDown={(e) => {
      if (e.key === "Enter") searchPodcast();
    }}
  />
  <button onClick={searchPodcast}>検索</button>
</div>

<div className="inkRadioSearch">
  <input
    value={podcastAiQuery}
    onChange={(e) => setPodcastAiQuery(e.target.value)}
    placeholder="AI Podcast検索"
  />
  <button onClick={aiSearchPodcast}>AI</button>
</div>

<div className="inkRadioList">
  {podcastEpisodes.map((item) => (
    <button
      key={item.audioUrl}
      className="inkRadioItem"
      onClick={() => playItem(item, podcastEpisodes)}
    >
      <span>▶</span>
      <div>
        <strong>{item.title}</strong>
        <small>{item.source}</small>
      </div>
    </button>
  ))}
</div>
    </section>
  );
}