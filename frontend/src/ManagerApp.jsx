import { useState } from "react";
import { widgetRegistry } from "./data/widgetRegistry";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { load } from "@tauri-apps/plugin-store";
import { emit } from "@tauri-apps/api/event";

const STORE_FILE = "widget-positions.json";

async function getStore() {
  return await load(STORE_FILE, { autoSave: true });
}

async function savePosition(widgetId, win) {
  try {
    const store = await getStore();
    const pos = await win.outerPosition();
    const size = await win.outerSize();
    await store.set(widgetId, {
      x: pos.x,
      y: pos.y,
      width: size.width,
      height: size.height,
    });
  } catch (e) {
    console.error("savePosition error:", e);
  }
}

async function loadPosition(widgetId) {
  try {
    const store = await getStore();
    return await store.get(widgetId);
  } catch (e) {
    console.error("loadPosition error:", e);
    return null;
  }
}

export default function ManagerApp() {
  const [activeWidgets, setActiveWidgets] = useState({});
  const [opacity, setOpacity] = useState(100);
  const [rgb, setRgb] = useState({ r: 15, g: 23, b: 42 });
  const [scale, setScale] = useState(100);

  const bgColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

  async function launchWidget(widget) {
    if (activeWidgets[widget.id]) {
      try {
        const win = await WebviewWindow.getByLabel(widget.id);
        if (win) await win.setFocus();
      } catch (e) {
        console.error(e);
      }
      return;
    }

    try {
      const saved = await loadPosition(widget.id);

      const win = new WebviewWindow(widget.id, {
        url: `/widget/${widget.id}?opacity=${opacity}&scale=${scale}`,
        title: widget.label,
        width: saved?.width ?? widget.width,
        height: saved?.height ?? widget.height,
        x: saved?.x ?? undefined,
        y: saved?.y ?? undefined,
        resizable: true,
        alwaysOnTop: false,
        decorations: false,
        transparent: true,
        maximizable: false,
      });

      win.once("tauri://created", () => {
        setActiveWidgets((prev) => ({ ...prev, [widget.id]: true }));
      });

      win.once("tauri://destroyed", async () => {
        await savePosition(widget.id, win);
        setActiveWidgets((prev) => {
          const next = { ...prev };
          delete next[widget.id];
          return next;
        });
      });

      win.once("tauri://error", (e) => {
        console.error("Window error:", e);
      });

    } catch (e) {
      console.error(e);
    }
  }

  async function closeWidget(widgetId) {
    try {
      const win = await WebviewWindow.getByLabel(widgetId);
      if (win) {
        await savePosition(widgetId, win);
        await win.close();
      }
    } catch (e) {
      console.error(e);
    }
    setActiveWidgets((prev) => {
      const next = { ...prev };
      delete next[widgetId];
      return next;
    });
  }

  async function handleOpacityChange(value) {
    setOpacity(value);
    await emit("widget-opacity", { opacity: value / 100 });
  }

  async function handleRgbChange(key, value) {
    const next = { ...rgb, [key]: value };
    setRgb(next);
    const newBg = `rgb(${next.r}, ${next.g}, ${next.b})`;
    await emit("widget-bg", { bg: newBg });
  }

  return (
    <div style={{
      height: "100vh",
      overflowY: "auto",
      background: "#0f172a",
      color: "#f5f5f5",
      fontFamily: "system-ui, sans-serif",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    }}>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: "20px", color: "#f4d58d" }}>
          Ink Command
        </h1>
        <p style={{ margin: 0, fontSize: "12px", color: "#a3a3a3" }}>
          Widget Manager
        </p>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}>

        {/* 透明度 */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: "#a3a3a3" }}>ウィジェット透明度</span>
            <span style={{ fontSize: "13px", color: "#f4d58d" }}>{opacity}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => handleOpacityChange(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#f4d58d" }}
          />
        </div>

        {/* スケール */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: "#a3a3a3" }}>コンテンツ拡大縮小</span>
            <span style={{ fontSize: "13px", color: "#f4d58d" }}>{scale}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={150}
            step={5}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#f4d58d" }}
          />
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#a3a3a3" }}>
            ※起動前に設定してください
          </p>
        </div>

        {/* 背景色 */}
        <div>
          <div style={{ marginBottom: "8px", fontSize: "13px", color: "#a3a3a3" }}>
            ウィジェット背景色
          </div>
          <div style={{
            width: "100%",
            height: "24px",
            borderRadius: "6px",
            background: bgColor,
            border: "1px solid rgba(255,255,255,0.15)",
            marginBottom: "10px",
          }} />
          {[
            { key: "r", label: "R", color: "#fb7185" },
            { key: "g", label: "G", color: "#4ade80" },
            { key: "b", label: "B", color: "#60a5fa" },
          ].map(({ key, label, color }) => (
            <div key={key} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", color: color }}>{label}</span>
                <span style={{ fontSize: "12px", color: "#a3a3a3" }}>{rgb[key]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={255}
                value={rgb[key]}
                onChange={(e) => handleRgbChange(key, Number(e.target.value))}
                style={{ width: "100%", accentColor: color }}
              />
            </div>
          ))}
        </div>

      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {widgetRegistry.map((widget) => {
          const isActive = !!activeWidgets[widget.id];
          return (
            <div
              key={widget.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "12px",
                background: isActive
                  ? "rgba(244,213,141,0.08)"
                  : "rgba(255,255,255,0.04)",
                border: isActive
                  ? "1px solid rgba(244,213,141,0.25)"
                  : "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>
                  {widget.label}
                </div>
                <div style={{ fontSize: "11px", color: "#a3a3a3", marginTop: "2px" }}>
                  {widget.description}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {isActive ? (
                  <button
                    onClick={() => closeWidget(widget.id)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(251,113,133,0.35)",
                      background: "rgba(251,113,133,0.12)",
                      color: "#fb7185",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    閉じる
                  </button>
                ) : (
                  <button
                    onClick={() => launchWidget(widget)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(244,213,141,0.35)",
                      background: "rgba(244,213,141,0.12)",
                      color: "#f4d58d",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    起動
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
