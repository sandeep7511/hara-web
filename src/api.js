// Change this to your deployed API URL when hosting online
// For local dev: http://localhost:5001/api
// For ngrok:     https://YOUR_NGROK_URL/api
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

export const api = {
  get: async (endpoint, params = {}) => {
    const url = new URL(`${API_BASE}/${endpoint}`);
    Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, v));
    const r = await fetch(url.toString());
    if (!r.ok) throw new Error(`API error ${r.status}`);
    return r.json();
  },
  post: async (endpoint, body = {}) => {
    const r = await fetch(`${API_BASE}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.json();
  },
};

export default API_BASE;
