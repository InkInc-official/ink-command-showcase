import { useEffect, useRef, useState } from "react";
import AIModelSelect from "./AIModelSelect";
import { fetchAIInsight } from "../api/status";
import StatusBadge from "./parts/StatusBadge";

export default function AIInsightWidget({ model, setModel }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const runningRef = useRef(false);

  async function loadInsight() {
    if (runningRef.current) return;

    runningRef.current = true;
    setLoading(true);

    try {
      const data = await fetchAIInsight(model);
      setInsight(data);
    } catch (err) {
      setInsight({
        status: "error",
        insight: err.message
      });
    } finally {
      runningRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    setInsight(null);
    loadInsight();
  }, [model]);

  return (
    <section className="card">
      <h2 className="widgetTitle">AI Insight Widget</h2>

      <div className="machine">
        <AIModelSelect model={model} setModel={setModel} />

        <div className="row">
          <span>Status</span>
          <StatusBadge status={insight?.status === "ok" ? "online" : insight?.status || "unknown"} />
        </div>

        <p className="aiText">
          {loading && !insight
            ? "Analyzing..."
            : insight?.insight || "No insight yet."}
        </p>

        <button className="button" onClick={loadInsight} disabled={loading}>
          {loading ? "Analyzing..." : "Refresh Insight"}
        </button>
      </div>
    </section>
  );
}
