import Metric from "./parts/Metric";

function Machine({ name, status }) {
  return (
    <div className="machine">
      <h3>{name}</h3>

      {!status?.system ? (
        <p className="muted">Loading...</p>
      ) : (
        <>
          <Metric label="CPU" value={status.system.cpu_percent} />
          <Metric label="RAM" value={status.system.ram_percent} />
          <Metric label="Disk" value={status.system.disk_percent} />
        </>
      )}
    </div>
  );
}

export default function SystemWidget({
  mainPcStatus,
  magicStatus,
  localStatus,
  acepcStatus,
  botNucStatus,
}) {
  return (
    <section className="card">
      <h2 className="widgetTitle">System Widget</h2>

      <Machine name="Main PC" status={mainPcStatus} />
      <Machine name="MAGICNUC" status={magicStatus} />
      <Machine name="HP-Slimline" status={localStatus} />
      <Machine name="Acepc Backup" status={acepcStatus} />
      <Machine name="Bot NUC" status={botNucStatus} />
    </section>
  );
}
