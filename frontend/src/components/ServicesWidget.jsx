import StatusBadge from "./parts/StatusBadge";

export default function ServicesWidget({ services }) {
  return (
    <section className="card">
      <h2 className="widgetTitle">Services Widget</h2>

      {!services ? (
        <p className="muted">Loading...</p>
      ) : (
        <div className="machine">
          {Object.entries(services).map(([name, status]) => (
            <div className="row" key={name}>
              <span>{name}</span>
              <StatusBadge status={status} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
