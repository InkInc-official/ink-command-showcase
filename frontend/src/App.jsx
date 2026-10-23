import { useEffect, useState } from "react";
import {
  fetchLocalStatus,
  fetchMagicnucStatus,
  fetchMainPcStatus,
  fetchAcepcStatus,
  fetchAcepcStorage,
  fetchAcepcBackup,
  fetchInfraStatus,
  fetchMagicnucGpu,
  fetchRssFeed,
  fetchBotNucStatus,
} from "./api/status";

import SystemWidget from "./components/SystemWidget";
import GPUWidget from "./components/GPUWidget";
import ComfyQueueWidget from "./components/ComfyQueueWidget";
import InfrastructureWidget from "./components/InfrastructureWidget";
import StorageWidget from "./components/StorageWidget";
import BackupStatusWidget from "./components/BackupStatusWidget";
import AcepcHealthWidget from "./components/AcepcHealthWidget";
import ServicesWidget from "./components/ServicesWidget";
import AIOpsAssistantWidget from "./components/AIOpsAssistantWidget";
import InkLauncherWidget from "./components/InkLauncherWidget";
import RSSWidget from "./components/RSSWidget";
import InkRadioWidget from "./components/InkRadioWidget";

import "./style.css";
import "./ai.css";

function infraNodeToStatus(node) {
  if (!node || !node.system) return null;

  return {
    host: node.host || node.name,
    system: node.system,
    services: node.services || {},
    gpu: node.gpu,
    comfyui_queue: node.comfyui_queue,
  };
}


export default function App() {
  const [localStatus, setLocalStatus] = useState(null);
  const [magicStatus, setMagicStatus] = useState(null);
  const [mainPcStatus, setMainPcStatus] = useState(null);
  const [acepcStatus, setAcepcStatus] = useState(null);
  const [acepcStorage, setAcepcStorage] = useState(null);
  const [acepcBackup, setAcepcBackup] = useState(null);
  const [infraStatus, setInfraStatus] = useState(null);
  const [warnings, setWarnings] = useState({});
  const [aiModel, setAiModel] = useState("qwen2.5:3b");
  const [apiDebug, setApiDebug] = useState([]);
  const [magicGpu, setMagicGpu] = useState(null);
  const [rssFeed, setRssFeed] = useState(null);
  const [botNucStatus, setBotNucStatus] = useState(null);

  async function updateOne(key, fetcher, setter) {
  try {
    const start = performance.now();

    const data = await fetcher();

    const ms = Math.round(performance.now() - start);

    setter(data);

    setApiDebug(prev => [
      ...prev.filter(x => x.key !== key),
      {
        key,
        status: "ok",
        ms,
      },
    ]);
  } catch (e) {
    setApiDebug(prev => [
      ...prev.filter(x => x.key !== key),
      {
        key,
        status: "error",
        error: String(e),
      },
    ]);

    console.error(key, e);
  }
}

  function loadStatus() {
    updateOne("local", fetchLocalStatus, setLocalStatus);
    updateOne("magicnuc", fetchMagicnucStatus, setMagicStatus);
    updateOne("main_pc", fetchMainPcStatus, setMainPcStatus);
    updateOne("infra", fetchInfraStatus, setInfraStatus);
    updateOne("bot_nuc", fetchBotNucStatus, setBotNucStatus);
  }

useEffect(() => {
  const loadAcepc = () => {
    updateOne("acepc", fetchAcepcStatus, setAcepcStatus);

    setTimeout(() => {
      updateOne("storage", fetchAcepcStorage, setAcepcStorage);
    }, 3000);

    setTimeout(() => {
      updateOne("backup", fetchAcepcBackup, setAcepcBackup);
    }, 6000);
  };

  setTimeout(loadAcepc, 30000);

  const acepcTimer = setInterval(loadAcepc, 60000);

  return () => clearInterval(acepcTimer);
}, []);

useEffect(() => {
  const loadRss = () => {
    updateOne("rss", fetchRssFeed, setRssFeed);
  };

  setTimeout(loadRss, 30000);

  const rssTimer = setInterval(loadRss, 30 * 60 * 1000);

  return () => clearInterval(rssTimer);
}, []);

useEffect(() => {
  const loadGpu = () => {
    updateOne("magic_gpu", fetchMagicnucGpu, setMagicGpu);
  };

  setTimeout(loadGpu, 30000);

  const gpuInterval = setInterval(loadGpu, 60000);

  return () => clearInterval(gpuInterval);
}, []);

  useEffect(() => {
    loadStatus();
    const timer = setInterval(loadStatus, 60000);
    return () => clearInterval(timer);
  }, []);

  const warningCount = Object.keys(warnings).length;

  const mainPcStatusFromInfra =
    infraNodeToStatus(infraStatus?.main_pc) || mainPcStatus;
  
  const magicStatusFromInfra = infraNodeToStatus(infraStatus?.magicnuc) || magicStatus;

  return (
    <main className="app">
      <section className="card header">
        <h1>Ink Command Pro</h1>
        <p>Main PC + MAGICNUC + HP-Slimline + Acepc + Bot NUC</p>
        <p className="muted">{new Date().toLocaleString("ja-JP")}</p>
      </section>

      {warningCount > 0 && (
        <section className="card warning">{warningCount} API warning(s)</section>
      )}

      <section className="card">
        <h2 className="widgetTitle">AI Ops Center</h2>
        <AIOpsAssistantWidget model={aiModel} setModel={setAiModel} />
      </section>

     <section className="card">
  <h2 className="widgetTitle">Debug Widget</h2>

  {apiDebug.map((item) => (
    <div key={item.key} className="row">
      <span>{item.key}</span>

      {item.status === "ok" ? (
        <span>online ({item.ms} ms)</span>
      ) : (
        <span style={{ color: "red" }}>
          error: {item.error}
        </span>
      )}
    </div>
  ))}
</section>

      <SystemWidget
        mainPcStatus={mainPcStatusFromInfra}
        magicStatus={magicStatusFromInfra}
        localStatus={localStatus}
        acepcStatus={acepcStatus}
        botNucStatus={botNucStatus}
      />

      <GPUWidget gpu={magicGpu} />
      {/* <ComfyQueueWidget queue={magicStatusFromInfra?.comfyui_queue} /> */}
      <ServicesWidget services={magicStatusFromInfra?.services} />

      <InfrastructureWidget infra={infraStatus} />
      <StorageWidget storage={acepcStorage} />
      <BackupStatusWidget backup={acepcBackup} />
      <AcepcHealthWidget />
      <InkLauncherWidget />
      <InkRadioWidget />
      <RSSWidget rss={rssFeed} />
      
    </main>
  );
}
