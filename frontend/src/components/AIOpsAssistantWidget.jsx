import { useState } from "react";
import { askAIOps } from "../api/status";
import AIModelSelect from "./AIModelSelect";

export default function AIOpsAssistantWidget({ model, setModel }) {
  const [question, setQuestion] = useState("今どこが一番危ない？");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const data = await askAIOps(model, question);
      setAnswer(data.answer || "No answer.");
    } catch (err) {
      setAnswer(`AI Ops Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="machine">
      <AIModelSelect model={model} setModel={setModel} />

      <h3>AI Ops Assistant</h3>

      <textarea
        className="textarea"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        rows={3}
      />

      <button className="button" onClick={ask} disabled={loading}>
        {loading ? "Thinking..." : "Ask AI Ops"}
      </button>

      <p className="aiText">
        {answer || "質問すると、現在の監視データをもとにAIが答えます。"}
      </p>
    </div>
  );
}