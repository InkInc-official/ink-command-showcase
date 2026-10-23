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

export default function GPUWidget({ gpu }) {
  const g = gpu || {};

  return (
    <section className="card">
      <h2 className="widgetTitle">GPU Widget</h2>

      {!gpu ? (
        <p className="muted">Loading...</p>
      ) : (
        <div className="machine">
          <Row label="Name" value={g.name || "Unknown GPU"} />
          <div className="row">
            <span>Status</span>
            <StatusBadge status={g.status || "unknown"} />
          </div>

          {g.gpu_percent == null ? (
            <Row label="GPU Usage" value="N/A" />
          ) : (
            <Metric label="GPU Usage" value={g.gpu_percent} />
          )}

          {g.vram_percent == null ? (
            <Row label="VRAM" value="N/A" />
          ) : (
            <Metric label="VRAM" value={g.vram_percent} />
          )}

          <Row
            label="Dedicated"
            value={`${g.vram_used_mb ?? "N/A"} MB / ${g.vram_total_mb ?? "N/A"} MB`}
          />

          <Row
            label="Shared"
            value={`${g.shared_used_mb ?? "N/A"} MB`}
          />

        </div>
      )}
    </section>
  );
}
