import React, { useState, useEffect } from "react";
import { api } from "../api";

export default function Ambulance() {
  const [form, setForm] = useState({
    patient_name:"", condition:"", age:40,
    pickup_address:"", pickup_lat:6.9200, pickup_lng:79.8500,
  });
  const [result,     setResult]     = useState(null);
  const [dispatches, setDispatches] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(() => { loadDispatches(); }, []);

  async function loadDispatches() {
    try {
      const d = await api.get("ambulance/dispatches");
      setDispatches(d);
    } catch {}
  }

  async function handleDispatch(e) {
    e.preventDefault();
    if (!form.patient_name || !form.condition) {
      setError("Patient name and condition required."); return;
    }
    setError(""); setLoading(true); setResult(null);
    const r = await api.post("ambulance/dispatch", form);
    setLoading(false);
    if (r.success) { setResult(r); loadDispatches(); }
    else setError(r.error);
  }

  async function complete(id) {
    await api.post(`ambulance/${id}/complete`);
    loadDispatches();
  }

  const STATUS_COLOR = {
    dispatched: "badge-warning",
    arrived:    "badge-normal",
    completed:  "bg-gray-700 text-gray-400",
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">🚑 Ambulance Dispatch</h1>
      <p className="text-gray-400 text-sm">
        The AI routing engine analyses <strong>every hospital</strong> simultaneously —
        scoring on distance, specialist availability, imaging availability, and bed capacity
        to determine the optimal destination.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dispatch form */}
        <form onSubmit={handleDispatch} className="card space-y-4">
          <h2 className="font-semibold text-blue-400">New Dispatch Request</h2>
          <div>
            <label>Patient Name *</label>
            <input value={form.patient_name}
                   onChange={e=>set("patient_name",e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Age</label>
              <input type="number" min={0} max={120} value={form.age}
                     onChange={e=>set("age",parseInt(e.target.value)||0)} />
            </div>
            <div>
              <label>Pickup Address</label>
              <input value={form.pickup_address}
                     onChange={e=>set("pickup_address",e.target.value)}
                     placeholder="Optional" />
            </div>
          </div>
          <div>
            <label>Condition / Symptoms *</label>
            <textarea rows={3} value={form.condition}
                      onChange={e=>set("condition",e.target.value)}
                      placeholder="e.g. Crushing chest pain, sweating, left arm pain. Suspected MI."
                      required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Pickup Latitude</label>
              <input type="number" step="0.0001" value={form.pickup_lat}
                     onChange={e=>set("pickup_lat",parseFloat(e.target.value))} />
            </div>
            <div>
              <label>Pickup Longitude</label>
              <input type="number" step="0.0001" value={form.pickup_lng}
                     onChange={e=>set("pickup_lng",parseFloat(e.target.value))} />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Colombo centre ≈ 6.9271, 79.8612 &nbsp;·&nbsp;
            Kalubowila ≈ 6.8561, 79.8741
          </p>
          {error && (
            <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? "🧠 AI routing engine analysing..." : "🚑 Dispatch Ambulance"}
          </button>
        </form>

        {/* Dispatch result */}
        {result && (
          <div className="card space-y-4">
            <h2 className="font-semibold text-green-400">✅ Dispatched Successfully</h2>
            <div className="bg-green-950 border border-green-800 rounded-xl p-4">
              <div className="text-lg font-bold">{result.ambulance}</div>
              <div className="text-sm text-gray-300">Driver: {result.driver}</div>
              <div className="mt-3 space-y-1 text-sm">
                <div>🏥 <strong>Destination:</strong> {result.destination}</div>
                <div>📍 <strong>Distance:</strong> {result.distance_km} km</div>
                <div>⏱️ <strong>ETA:</strong> {result.eta_minutes} minutes</div>
                {result.specialist && (
                  <div>👨‍⚕️ <strong>Specialist:</strong> {result.specialist}</div>
                )}
                {result.imaging && (
                  <div>🔬 <strong>Imaging:</strong> {result.imaging}</div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-3 italic">
                {result.routing_reason?.slice(0,200)}
              </p>
            </div>

            <h3 className="font-semibold text-sm text-gray-400">All Hospitals Scored</h3>
            <div className="space-y-2">
              {(result.all_hospitals || []).map((h, i) => (
                <div key={i}
                     className={`rounded-lg p-3 border text-sm ${
                       i === 0
                         ? "bg-green-950 border-green-800"
                         : "bg-gray-800 border-gray-700"
                     }`}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">
                      {i===0 ? "✅ " : `#${i+1} `}{h.name}
                    </span>
                    <span className="text-gray-400">Score: {h.score}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>📍 {h.distance_km} km</span>
                    <span>⏱️ {h.eta_minutes} min</span>
                    <span>👨‍⚕️ {h.has_specialist ? "✅" : "❌"} Specialist</span>
                    <span>🔬 {h.has_imaging ? "✅" : "❌"} Imaging</span>
                    <span>🛏️ {h.beds} beds</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active dispatches */}
      <div className="card">
        <h2 className="font-semibold mb-4">Active & Recent Dispatches</h2>
        {dispatches.length ? (
          <div className="space-y-3">
            {dispatches.map(d => (
              <div key={d.id}
                   className="bg-gray-800 rounded-xl p-4 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{d.ambulance}</span>
                    <span className={`badge ${STATUS_COLOR[d.status]||"badge-normal"}`}>
                      {d.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">
                    {d.patient} → {d.destination}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    📍 {d.distance_km} km · ⏱️ {d.eta_minutes} min
                    {d.specialist ? ` · 👨‍⚕️ ${d.specialist}` : ""}
                    {d.imaging ? ` · 🔬 ${d.imaging}` : ""}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{d.dispatched}</div>
                </div>
                {d.status === "dispatched" && (
                  <button onClick={() => complete(d.id)}
                          className="btn-success text-sm self-start">
                    ✓ Complete
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No dispatches yet.</p>
        )}
      </div>
    </div>
  );
}
