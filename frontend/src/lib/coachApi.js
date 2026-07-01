const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export async function fetchCoachTip(payload) {
  if (!BACKEND_URL) {
    throw new Error("Missing VITE_BACKEND_URL");
  }

  const res = await fetch(`${BACKEND_URL}/api/coach`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`coach ${res.status}`);
  const data = await res.json();
  return (data.message || "").trim();
}
