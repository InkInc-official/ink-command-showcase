import StatusBadge from "./parts/StatusBadge";

function Row({ label, value }) {
  return (
    <div className="row">
      <span>{label}</span>
      <span className="value">{value}</span>
    </div>
  );
}

export default function BackupStatusWidget({ backup }) {
  return (
    <section className="card">
      <h2 className="widgetTitle">Backup Status Widget</h2>

      {!backup ? (
        <p className="muted">Loading...</p>
      ) : (
        <div className="machine">
          <h3>{backup.name || "Acepc Backup"}</h3>

          <div className="row">
            <span>Status</span>
            <StatusBadge status={backup.status || "unknown"} />
          </div>

          <Row label="Mode" value={backup.mode || "Weekly + Manual"} />
          <Row label="Last Backup" value={backup.last_backup || "Not recorded"} />
          <p className="muted">HP-Slimline → Acepc</p>
        </div>
      )}
    </section>
  );
}
