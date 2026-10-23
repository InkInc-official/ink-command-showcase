import { useEffect, useState } from "react";
import { fetchAIModels } from "../api/status";

const FALLBACK_MODELS = [
  "qwen2.5:3b",
  "qwen2.5:7b",
  "mistral:7b",
  "gemma2:9b"
];

export default function AIModelSelect({ model, setModel }) {
  const [models, setModels] = useState(FALLBACK_MODELS);
  const [status, setStatus] = useState("");

  async function loadModels() {
    try {
      const data = await fetchAIModels();

      if (data.models && data.models.length > 0) {
        setModels(data.models);

        if (!data.models.includes(model)) {
          setModel(data.models[0]);
        }

        setStatus(`${data.models.length} models`);
      } else {
        setStatus("fallback models");
      }
    } catch (err) {
      setStatus("model list unavailable");
    }
  }

  useEffect(() => {
    loadModels();
  }, []);

  return (
    <>
      <div className="row">
        <span>Model</span>
        <select
          value={model}
          onChange={(event) => setModel(event.target.value)}
          style={{
            background: "#23232c",
            color: "#f5e6c8",
            border: "1px solid #4b4030",
            borderRadius: "10px",
            padding: "8px 10px",
            fontSize: "14px",
          }}
        >
          {models.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <p className="muted">{status}</p>
    </>
  );
}