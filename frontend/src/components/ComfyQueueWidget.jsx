import StatusBadge from "./parts/StatusBadge";

export default function ComfyQueueWidget({ queue }) {
  const q = queue || {};
  const status = q.status || "unknown";
  const visualStatus =
    status === "online" && Number(q.running || 0) > 0
      ? "active"
      : status;

  return (
    <section className="card">
      <h2 className="widgetTitle">ComfyUI Queue Widget</h2>

      {!queue ? (
        <p className="muted">Loading...</p>
      ) : (
        <div className="machine">
          <div className="row">
            <span>Status</span>
            <StatusBadge status={visualStatus} />
          </div>

          <div className="queueGrid">
            <div className="queueBox">
              <div className="queueLabel">Running</div>
              <div className="queueNumber">{q.running ?? 0}</div>
            </div>

            <div className="queueBox">
              <div className="queueLabel">Pending</div>
              <div className="queueNumber">{q.pending ?? 0}</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
