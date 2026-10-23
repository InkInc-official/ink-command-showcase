export async function fetchAcepcHealth() {
  const response = await fetch("http://HOST_3_IP:8765/backup-node-health");
  if (!response.ok) throw new Error(`Acepc health failed: ${response.status}`);
  return await response.json();
}
