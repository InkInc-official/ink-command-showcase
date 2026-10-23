const API_BASE_URL = "http://127.0.0.1:8765";

const LOCAL_STATUS_URL = `${API_BASE_URL}/status`;
const LOCAL_INFRA_URL = `${API_BASE_URL}/infra`;

const MAGICNUC_STATUS_URL = "http://HOST_1_IP:8765/status";
const MAIN_PC_STATUS_URL = "http://HOST_2_IP:8765/status";
const ACEPC_STATUS_URL = "http://HOST_3_IP:8765/status";
const ACEPC_STORAGE_URL = "http://HOST_3_IP:8765/storage";
const ACEPC_BACKUP_URL = "http://HOST_3_IP:8765/backup";
const MAGICNUC_GPU_URL = "http://HOST_1_IP:8765/gpu";
const BOT_NUC_STATUS_URL = "http://HOST_4_IP:8765/status";

export async function fetchBotNucStatus() {
  return await fetchJson(BOT_NUC_STATUS_URL, 15000);
}

export async function fetchMagicnucGpu() {
  return await fetchJson(MAGICNUC_GPU_URL, 15000);
}

export async function fetchJson(url, timeoutMs = 12000) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`${url} failed: ${response.status}`);
  }

  return await response.json();
}

export async function postJson(url, payload, timeoutMs = 120000) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`${url} failed: ${response.status}`);
  }

  return await response.json();
}

export async function fetchLocalStatus() {
  return await fetchJson(LOCAL_STATUS_URL, 15000);
}

export async function fetchMagicnucStatus() {
  return await fetchJson(MAGICNUC_STATUS_URL, 30000);
}

export async function fetchMainPcStatus() {
  return await fetchJson(MAIN_PC_STATUS_URL, 30000);
}

export async function fetchAcepcStatus() {
  return await fetchJson(ACEPC_STATUS_URL, 15000);
}

export async function fetchAcepecStatus() {
  return await fetchAcepcStatus();
}

export async function fetchAcepcStorage() {
  return await fetchJson(ACEPC_STORAGE_URL, 15000);
}

export async function fetchAcepecStorage() {
  return await fetchAcepcStorage();
}

export async function fetchAcepcBackup() {
  return await fetchJson(ACEPC_BACKUP_URL, 15000);
}

export async function fetchInfraStatus() {
  return await fetchJson(LOCAL_INFRA_URL, 25000);
}

export async function fetchAIModels() {
  return await fetchJson(`${API_BASE_URL}/ai/models`, 15000);
}

export async function fetchAIInsight(model) {
  return await fetchJson(
    `${API_BASE_URL}/ai/insight?model=${encodeURIComponent(model)}`,
    180000
  );
}

export async function fetchAIPrediction(model) {
  return await fetchJson(
    `${API_BASE_URL}/ai/predict?model=${encodeURIComponent(model)}`,
    30000
  );
}

export async function askAIOps(model, question) {
  return await postJson(
    `${API_BASE_URL}/ai/ops`,
    {
      model,
      question,
    },
    180000
  );
}

export async function fetchRssFeed() {
  return await fetchJson(`${API_BASE_URL}/rss`, 30000);
}