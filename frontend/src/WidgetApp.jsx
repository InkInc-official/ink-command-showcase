import SystemWidget from "./components/SystemWidget";
import GPUWidget from "./components/GPUWidget";
import InfrastructureWidget from "./components/InfrastructureWidget";
import ServicesWidget from "./components/ServicesWidget";
import AIOpsAssistantWidget from "./components/AIOpsAssistantWidget";
import InkRadioWidget from "./components/InkRadioWidget";
import RSSWidget from "./components/RSSWidget";
import BackupStatusWidget from "./components/BackupStatusWidget";
import AcepcHealthWidget from "./components/AcepcHealthWidget";
import InkLauncherWidget from "./components/InkLauncherWidget";

import { listen } from "@tauri-apps/api/event";
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
  fetchBotNucStatus,
} from "./api/status";

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

async function drag() {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    await win.startDragging();
  } catch(e) {
    console.error("drag error:", e);
  }
}

async function resize(direction) {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    await win.startResizeDragging(direction);
  } catch(e) {
    console.error("resize error:", e);
  }
}

export default function WidgetApp() {
  const widgetId = window.location.pathname.replace("/widget/", "");

  const params = new URLSearchParams(window.location.search);
  const initialOpacity = parseFloat(params.get("opacity") ?? "100") / 100;
  const initialScale = parseFloat(params.get("scale") ?? "100") / 100;

  const [currentOpacity, setCurrentOpacity] = useState(initialOpacity);
  const [dragBarVisible, setDragBarVisible] = useState(false);
  const [localStatus, setLocalStatus] = useState(null);
  const [magicStatus, setMagicStatus] = useState(null);
  const [mainPcStatus, setMainPcStatus] = useState(null);
  const [acepcStatus, setAcepcStatus] = useState(null);
  const [acepcStorage, setAcepcStorage] = useState(null);
  const [acepcBackup, setAcepcBackup] = useState(null);
  const [infraStatus, setInfraStatus] = useState(null);
  const [magicGpu, setMagicGpu] = useState(null);
  const [botNucStatus, setBotNucStatus] = useState(null);
  const [aiModel, setAiModel] = useState("qwen2.5:3b");

  useEffect(() => {
    let unlistenOpacity;

    listen("widget-opacity", (event) => {
      setCurrentOpacity(event.payload.opacity);
    }).then((fn) => { unlistenOpacity = fn; });

    return () => {
      if (unlistenOpacity) unlistenOpacity();
    };
  }, []);

  async function updateOne(fetcher, setter) {
    try {
      const data = await fetcher();
      setter(data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    const needsStatus = ["system", "infrastructure", "services", "ai_ops"];
    const needsAcepc = ["backup", "acepc_health"];
    const needsGpu = ["gpu"];

    if (needsStatus.includes(widgetId)) {
      updateOne(fetchLocalStatus, setLocalStatus);
      updateOne(fetchMagicnucStatus, setMagicStatus);
      updateOne(fetchMainPcStatus, setMainPcStatus);
      updateOne(fetchInfraStatus, setInfraStatus);
      updateOne(fetchBotNucStatus, setBotNucStatus);

      const timer = setInterval(() => {
        updateOne(fetchLocalStatus, setLocalStatus);
        updateOne(fetchMagicnucStatus, setMagicStatus);
        updateOne(fetchMainPcStatus, setMainPcStatus);
        updateOne(fetchInfraStatus, setInfraStatus);
        updateOne(fetchBotNucStatus, setBotNucStatus);
      }, 60000);

      return () => clearInterval(timer);
    }

    if (needsAcepc.includes(widgetId)) {
      updateOne(fetchAcepcStatus, setAcepcStatus);
      updateOne(fetchAcepcStorage, setAcepcStorage);
      updateOne(fetchAcepcBackup, setAcepcBackup);

      const timer = setInterval(() => {
        updateOne(fetchAcepcStatus, setAcepcStatus);
        updateOne(fetchAcepcStorage, setAcepcStorage);
        updateOne(fetchAcepcBackup, setAcepcBackup);
      }, 120000);

      return () => clearInterval(timer);
    }

    if (needsGpu.includes(widgetId)) {
      updateOne(fetchMagicnucGpu, setMagicGpu);

      const timer = setInterval(() => {
        updateOne(fetchMagicnucGpu, setMagicGpu);
      }, 60000);

      return () => clearInterval(timer);
    }
  }, [widgetId]);

  const mainPcStatusFromInfra =
    infraNodeToStatus(infraStatus?.main_pc) || mainPcStatus;
  const magicStatusFromInfra =
    infraNodeToStatus(infraStatus?.magicnuc) || magicStatus;

  const widgetMap = {
    system: (
      <SystemWidget
        mainPcStatus={mainPcStatusFromInfra}
        magicStatus={magicStatusFromInfra}
        localStatus={localStatus}
        acepcStatus={acepcStatus}
        botNucStatus={botNucStatus}
      />
    ),
    gpu: <GPUWidget gpu={magicGpu} />,
    infrastructure: <InfrastructureWidget infra={infraStatus} />,
    services: <ServicesWidget services={magicStatusFromInfra?.services} />,
    ai_ops: (
      <section className="card">
        <h2 className="widgetTitle">AI Ops Center</h2>
        <AIOpsAssistantWidget model={aiModel} setModel={setAiModel} />
      </section>
    ),
    ink_radio: <InkRadioWidget />,
    rss: <RSSWidget />,
    backup: <BackupStatusWidget backup={acepcBackup} />,
    acepc_health: <AcepcHealthWidget />,
    launcher: <InkLauncherWidget />,
  };

  const content = widgetMap[widgetId];

  if (!content) {
    return (
      <div style={{
        padding: "24px",
        color: "#f5f5f5",
        background: "#0f172a",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}>
        <p>Widget not found: {widgetId}</p>
      </div>
    );
  }

  return (
    <div style={{
      background: "transparent",
      opacity: currentOpacity,
      position: "relative",
      minHeight: "100vh",
    }}>

      {/* 移動バー */}
      <div
        onMouseEnter={() => setDragBarVisible(true)}
        onMouseLeave={() => setDragBarVisible(false)}
        onMouseDown={drag}
        style={{
          height: "28px",
          background: dragBarVisible ? "rgba(244,213,141,0.15)" : "rgba(0,0,0,0)",
          borderBottom: dragBarVisible ? "1px solid rgba(244,213,141,0.25)" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "grab",
          userSelect: "none",
          transition: "background 0.15s",
        }}
      >
        {dragBarVisible && (
          <div style={{
            width: "40px",
            height: "4px",
            borderRadius: "999px",
            background: "rgba(244,213,141,0.5)",
          }} />
        )}
      </div>

      {/* コンテンツ（スケール適用） */}
      <div style={{
        padding: "16px",
        transform: `scale(${initialScale})`,
        transformOrigin: "top left",
        width: `${Math.round(100 / initialScale)}%`,
      }}>
        {content}
      </div>

      {/* リサイズハンドル（右下） */}
<div
  onMouseDown={() => resize("SouthEast")}
  style={{
    position: "fixed",
    bottom: "0px",
    right: "0px",
    width: "40px",
    height: "40px",
    cursor: "nwse-resize",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    padding: "6px",
    zIndex: 9999,
  }}
>
  <svg width="16" height="16" viewBox="0 0 12 12">
    <path
      d="M11 1 L1 11 M11 5 L5 11 M11 9 L9 11"
      stroke="#f4d58d"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.5"
    />
  </svg>
</div>

    </div>
  );
}
