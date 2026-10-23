import { useEffect, useRef, useState } from "react";
import { fetchAIPrediction } from "../api/status";
import StatusBadge from "./parts/StatusBadge";

export default function AIFailurePredictionWidget({ model }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const runningRef = useRef(false);

  async function loadPrediction() {
    if (runningRef.current) return;

    runningRef.current = true;
    setLoading(true);

    try {
      const data = await fetchAIPrediction(model);
      setPrediction(data);
    } catch (err) {
      setPrediction({
        status: "error",
        prediction: err.message
      });
    } finally {
      runningRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    setPrediction(null);
    loadPrediction();
  }, [model]);

  return (
    <section className="card">
      <h2 className="widgetTitle">AI Failure Prediction</h2>

      <div className="machine">
        <div className="row">
          <span>Status</span>
          <StatusBadge status={prediction?.status === "ok" ? "online" : prediction?.status || "unknown"} />
        </div>

        <p className="aiText">
          {loading && !prediction
            ? "Predicting..."
            : prediction?.prediction || "No prediction yet."}
        </p>

        <button className="button" onClick={loadPrediction} disabled={loading}>
          {loading ? "Predicting..." : "Refresh Prediction"}
        </button>
      </div>
    </section>
  );
}
