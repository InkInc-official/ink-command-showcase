import { inkApps } from "../data/inkApps";

export default function InkLauncherWidget() {
 const openApp = async (app) => {
  if (!app.url) return;

  if (app.url.startsWith("launch:")) {
    const appName = app.url.replace("launch:", "");

    await fetch(`http://localhost:8765/launch/${appName}`, {
      method: "POST",
    });

    return;
  }

  window.open(app.url, "_blank", "noopener,noreferrer");
};

  return (
    <section className="card">
      <h2 className="widgetTitle">Ink Launcher</h2>

      <div className="launcherGrid">
        {inkApps.map((app) => (
          <button
            key={app.name}
            className="launcherButton"
            onClick={() => openApp(app)}
            disabled={!app.url}
          >
            <span className="launcherIcon">
              <img src={app.icon} alt={app.name} />
            </span>
            <span className="launcherText">
              <strong>{app.name}</strong>
              <small>{app.type}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
