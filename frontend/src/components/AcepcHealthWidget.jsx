import { useEffect, useState } from "react";
import { fetchAcepcHealth } from "../api/acepcHealth";
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

function riskToStatus(risk) {
  if (risk === "normal") return "online";
  if (risk === "warning") return "active";
  if (risk === "danger") return "offline";
  return "unknown";
}

function BackupFolderGroup({ name, group }) {
  if (!group) return null;

  return (
    <div className="machine">
      <h3>{name} Sync Folders</h3>

      <div className="row">
        <span>Status</span>
        <StatusBadge status={group.status === "ok" ? "online" : "active"} />
      </div>

      <Row label="Method" value={group.method || "unknown"} />
      <Row label="Total Size" value={`${group.total_size_gb ?? 0} GB`} />

      {group.folders?.map((folder) => (
        <div className="row" key={folder.path}>
          <span>{folder.folder}</span>
          <span className="value">
            {folder.status} / {folder.size_gb} GB
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AcepcHealthWidget() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");

  async function loadHealth() {
    try {
      const data = await fetchAcepcHealth();
      setHealth(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadHealth();
    const timer = setInterval(loadHealth, 120000);
    return () => clearInterval(timer);
  }, []);

  const folderGroups = health?.backup_folders?.groups || {};

  return (
    <section className="card">
      <h2 className="widgetTitle">Acepc Backup Node Health</h2>

      {!health ? (
        <div className="machine">
          <p className="muted">{error || "Loading..."}</p>
        </div>
      ) : (
        <>
          <div className="machine">
            <h3>{health.node}</h3>
            <div className="row">
              <span>Risk</span>
              <StatusBadge status={riskToStatus(health.risk?.level)} />
            </div>
            <Row label="Level" value={health.risk?.level || "unknown"} />
            <Row label="Tailscale" value={health.tailscale_ip} />
            <Row label="Last Check" value={health.timestamp?.slice(0, 19) || "N/A"} />
            {health.risk?.warnings?.length > 0 ? (
              <p className="aiText">{health.risk.warnings.join("\n")}</p>
            ) : (
              <p className="muted">No critical warnings.</p>
            )}
          </div>

          <div className="machine">
            <h3>Root Disk</h3>
            <Metric label="Used" value={health.system_disk?.percent} />
            <Row label="Mount" value={health.system_disk?.mount || "/"} />
            <Row label="Used / Total" value={`${health.system_disk?.used_gb ?? "N/A"} GB / ${health.system_disk?.total_gb ?? "N/A"} GB`} />
            <Row label="Free" value={`${health.system_disk?.free_gb ?? "N/A"} GB`} />
            <Row label="Risk" value={health.system_disk?.risk || "unknown"} />
          </div>

          <div className="machine">
            <h3>Backup HDD</h3>
            <div className="row">
              <span>Mount Guard</span>
              <StatusBadge status={health.mount_guard?.status === "mounted" ? "online" : "offline"} />
            </div>
            <Metric label="Used" value={health.backup_disk?.percent} />
            <Row label="Mount" value={health.backup_disk?.mount || "/mnt/backup"} />
            <Row label="Used / Total" value={`${health.backup_disk?.used_gb ?? "N/A"} GB / ${health.backup_disk?.total_gb ?? "N/A"} GB`} />
            <Row label="Free" value={`${health.backup_disk?.free_gb ?? "N/A"} GB`} />
          </div>

          <div className="machine">
            <h3>Syncthing</h3>
            <div className="row">
              <span>Status</span>
              <StatusBadge status={health.syncthing?.status === "active" ? "online" : "offline"} />
            </div>
            <Row label="Memory" value={`${health.syncthing?.memory_mb ?? 0} MB`} />
            <Row label="Risk" value={health.syncthing?.risk || "unknown"} />
          </div>

          <div className="machine">
            <h3>Wrong Location</h3>
            <div className="row">
              <span>Status</span>
              <StatusBadge status={health.wrong_location?.status === "clear" ? "online" : "offline"} />
            </div>
            {health.wrong_location?.items?.length > 0 ? (
              <p className="aiText">
                {health.wrong_location.items.map((item) => `${item.path}: ${item.size_gb} GB`).join("\n")}
              </p>
            ) : (
              <p className="muted">No wrong backup location detected.</p>
            )}
          </div>

          <div className="machine">
            <h3>I/O Error Detection</h3>
            <div className="row">
              <span>Status</span>
              <StatusBadge status={health.io_errors?.status === "clear" ? "online" : health.io_errors?.status === "warning" ? "offline" : "unknown"} />
            </div>
            <Row label="Last Error" value={health.io_errors?.last_error || "None"} />
          </div>

          <BackupFolderGroup name="HP-Slimline" group={folderGroups["HP-Slimline"]} />
          <BackupFolderGroup name="MAGICNUC" group={folderGroups["MAGICNUC"]} />
        </>
      )}
    </section>
  );
}
