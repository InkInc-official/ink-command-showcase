import Metric from "./parts/Metric";
import StatusBadge from "./parts/StatusBadge";

function Row({ label, value }) {
  return (
    <div className="row">
      <span>{label}</span>
      <span className="value">{value}</span>
    </div>
  );
}

export default function StorageWidget({ storage }) {
  return (
    <section className="card">
      <h2 className="widgetTitle">Storage Widget</h2>

      {!storage ? (
        <p className="muted">Loading...</p>
      ) : (
        <div className="machine">
          <h3>{storage.name || "Storage"}</h3>

          <div className="row">
            <span>Status</span>
            <StatusBadge status={storage.status || "unknown"} />
          </div>

          <Row label="Mount" value={storage.mount || "unknown"} />
          <Metric label="Used" value={storage.percent} />

          <Row
            label="Used / Total"
            value={`${storage.used_gb ?? "N/A"} GB / ${storage.total_gb ?? "N/A"} GB`}
          />

          <Row
            label="Free"
            value={`${storage.free_gb ?? "N/A"} GB`}
          />
        </div>
      )}
    </section>
  );
}
