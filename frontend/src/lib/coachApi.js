const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Calls the backend LLM coach. Returns the message string, or throws.
export async function fetchCoachTip(payload) {
  const res = await fetch(`${BACKEND_URL}/api/coach`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`coach ${res.status}`);
  const data = await res.json();
  return (data.message || "").trim();
}
