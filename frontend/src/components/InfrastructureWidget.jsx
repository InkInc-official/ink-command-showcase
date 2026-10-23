import StatusBadge from "./parts/StatusBadge";

function normalizeInfra(infra) {
  if (!infra) return [];

  return Object.entries(infra).map(([key, node]) => ({
    id: key,
    name: node.name || key,
    ip: node.ip || "unknown",
    status: node.status || "unknown",
    role: node.role || "",
    latency: node.latency || "N/A",
  }));
}

export default function InfrastructureWidget({ infra }) {
  const targets = normalizeInfra(infra);

  return (
    <section className="card">
      <h2 className="widgetTitle">Infrastructure Widget</h2>

      {targets.length === 0 ? (
        <p className="muted">Loading...</p>
      ) : (
        targets.map((target) => (
          <div className="machine" key={target.id}>
            <h3>{target.name}</h3>

            <div className="row">
              <span>IP</span>
              <span className="value">{target.ip}</span>
            </div>

            <div className="row">
              <span>Status</span>
              <StatusBadge status={target.status} />
            </div>

            <div className="row">
              <span>Latency</span>
              <span className="value">{target.latency}</span>
            </div>

            {target.role && <p className="muted">{target.role}</p>}
          </div>
        ))
      )}
    </section>
  );
}
