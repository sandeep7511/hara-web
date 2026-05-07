import React, { useState, useEffect, useCallback } from "react";
import { api } from "../api";

const MACHINE_ICONS = {
  "X-Ray":"☢️","MRI":"🧲","CT Scanner":"🖥️","Ultrasound":"🔊","ECG":"💓"
};

// ─── Imaging ────────────────────────────────────────────────────────────────
export function Imaging({ selHospId, hospitals }) {
  const [machines,  setMachines]  = useState([]);
  const [requests,  setRequests]  = useState([]);
  const [toggling,  setToggling]  = useState(null);
  const [allPatients, setAllPatients] = useState([]);
  const [imgForm, setImgForm] = useState({ patient_id:"", machine_type:"X-Ray", reason:"" });
  const [imgMsg,  setImgMsg]  = useState(null);

  const load = useCallback(async () => {
    try {
      const [m, r, p] = await Promise.all([
        api.get("imaging/machines"),
        api.get("imaging/requests", { hospital_id: selHospId }),
        api.get("patients/all",     { hospital_id: selHospId }),
      ]);
      setMachines(m);
      setRequests(r);
      setAllPatients((p.patients || []).filter(pt => pt.status === "admitted"));
    } catch {}
  }, [selHospId]);

  useEffect(() => { load(); }, [load]);

  async function toggle(id) {
    setToggling(id);
    await api.post(`imaging/machines/${id}/toggle`);
    await load();
    setToggling(null);
  }

  async function requestImaging(e) {
    e.preventDefault();
    setImgMsg(null);
    const hosp = hospitals.find(h => h.id === selHospId);
    const r = await api.post("imaging/request", {
      patient_id:   parseInt(imgForm.patient_id),
      machine_type: imgForm.machine_type,
      hospital_id:  selHospId,
      reason:       imgForm.reason,
    });
    if (r.success) {
      setImgMsg({ ok: true,  text: r.available ? `✅ Assigned to ${r.machine}` : "⚠️ No machine available — marked pending" });
    } else {
      setImgMsg({ ok: false, text: r.error });
    }
    load();
  }

  // Group machines by hospital → type
  const byHosp = {};
  machines.forEach(m => {
    const h = hospitals.find(h => h.id === m.hospital_id);
    const hname = h ? h.name : `Hospital ${m.hospital_id}`;
    if (!byHosp[hname]) byHosp[hname] = {};
    if (!byHosp[hname][m.machine_type]) byHosp[hname][m.machine_type] = [];
    byHosp[hname][m.machine_type].push(m);
  });

  // For availability check in form
  const availForType = machines.filter(
    m => m.hospital_id === selHospId &&
         m.machine_type === imgForm.machine_type &&
         m.is_available
  ).length;

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">🔬 Imaging Control</h1>
      <p className="text-gray-400 text-sm">
        Toggle machines on/off. Availability feeds directly into the ambulance routing engine in real time.
      </p>

      {Object.entries(byHosp).map(([hname, types]) => (
        <div key={hname} className="card">
          <h2 className="font-semibold mb-4 text-blue-400">🏥 {hname}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(types).map(([mtype, mlist]) => (
              <div key={mtype}>
                <div className="text-sm font-medium text-gray-400 mb-2">
                  {MACHINE_ICONS[mtype] || "🔬"} {mtype}
                </div>
                <div className="space-y-2">
                  {mlist.map(m => (
                    <button
                      key={m.id}
                      onClick={() => toggle(m.id)}
                      disabled={toggling === m.id}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg border
                        transition-all disabled:opacity-50
                        ${m.is_available
                          ? "bg-green-950 border-green-800 text-green-300 hover:bg-green-900"
                          : "bg-red-950 border-red-800 text-red-300 hover:bg-red-900"
                        }`}
                    >
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs mt-0.5">
                        {toggling === m.id ? "Updating..." :
                         m.is_available ? "🟢 Available" : "🔴 Offline"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Manual imaging request */}
      <div className="card">
        <h2 className="font-semibold mb-4 text-blue-400">➕ Request Imaging for Patient</h2>
        {allPatients.length === 0 ? (
          <p className="text-gray-500 text-sm">No admitted patients to request imaging for.</p>
        ) : (
          <form onSubmit={requestImaging} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label>Patient</label>
                <select value={imgForm.patient_id}
                        onChange={e => setImgForm(f => ({ ...f, patient_id: e.target.value }))}
                        required>
                  <option value="">Select patient...</option>
                  {allPatients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.ward})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Imaging Type</label>
                <select value={imgForm.machine_type}
                        onChange={e => setImgForm(f => ({ ...f, machine_type: e.target.value }))}>
                  {["X-Ray","MRI","CT Scanner","Ultrasound","ECG"].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Clinical Reason</label>
                <input value={imgForm.reason}
                       onChange={e => setImgForm(f => ({ ...f, reason: e.target.value }))}
                       placeholder="e.g. Suspected pneumonia" />
              </div>
            </div>
            <div className={`text-sm rounded-lg px-3 py-2 ${
              availForType > 0
                ? "bg-green-950 border border-green-800 text-green-300"
                : "bg-orange-950 border border-orange-800 text-orange-300"
            }`}>
              {availForType > 0
                ? `✅ ${availForType} ${imgForm.machine_type} machine(s) available at this hospital`
                : `⚠️ No ${imgForm.machine_type} available — request will be marked pending or routed to partner hospital`}
            </div>
            {imgMsg && (
              <div className={`text-sm rounded-lg px-3 py-2 ${
                imgMsg.ok
                  ? "bg-green-950 border border-green-800 text-green-300"
                  : "bg-red-950 border border-red-800 text-red-300"
              }`}>{imgMsg.text}</div>
            )}
            <button type="submit" className="btn-primary">Request Imaging</button>
          </form>
        )}
      </div>

      {/* Imaging requests table */}
      <div className="card">
        <h2 className="font-semibold mb-3">📋 Recent Imaging Requests</h2>
        {requests.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left py-2 pr-3">Patient</th>
                <th className="text-left py-2 pr-3">Type</th>
                <th className="text-left py-2 pr-3">Machine</th>
                <th className="text-left py-2 pr-3">Status</th>
                <th className="text-left py-2">Requested</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} className="border-b border-gray-800/50">
                  <td className="py-2 pr-3 font-medium">{r.patient}</td>
                  <td className="py-2 pr-3">{MACHINE_ICONS[r.machine_type] || "🔬"} {r.machine_type}</td>
                  <td className="py-2 pr-3 text-gray-400">{r.machine}</td>
                  <td className="py-2 pr-3">
                    <span className={`badge ${
                      r.status === "completed"   ? "badge-normal"  :
                      r.status === "in-progress" ? "badge-warning" :
                                                   "bg-gray-700 text-gray-400"
                    }`}>{r.status}</span>
                  </td>
                  <td className="py-2 text-gray-400">{r.requested}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-sm">No imaging requests yet.</p>
        )}
      </div>
    </div>
  );
}

// ─── Network ─────────────────────────────────────────────────────────────────
export function Network({ hospitals }) {
  const [ambulances, setAmbulances] = useState([]);

  useEffect(() => {
    api.get("ambulances").then(setAmbulances).catch(() => {});
  }, []);

  function hdist(h1, h2) {
    const R = 6371;
    const d1 = (h2.lat - h1.lat) * Math.PI / 180;
    const d2 = (h2.lng - h1.lng) * Math.PI / 180;
    const a  = Math.sin(d1/2)**2 +
               Math.cos(h1.lat * Math.PI/180) *
               Math.cos(h2.lat * Math.PI/180) *
               Math.sin(d2/2)**2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(2);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">🌐 Hospital Network</h1>

      {hospitals.map(h => {
        const imaging  = h.imaging || [];
        const byType   = {};
        imaging.forEach(m => {
          if (!byType[m.type]) byType[m.type] = [];
          byType[m.type].push(m);
        });

        return (
          <div key={h.id}
               className={`card border-l-4 ${h.is_main ? "border-l-blue-500" : "border-l-green-500"}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-bold text-lg">
                  {h.is_main ? "🏥" : "🏨"} {h.name}
                </h2>
                <p className="text-gray-400 text-sm">{h.address}</p>
                {h.phone && <p className="text-gray-500 text-xs mt-0.5">{h.phone}</p>}
              </div>
              <span className={`badge ${
                h.is_main
                  ? "bg-blue-900 text-blue-300"
                  : "bg-green-900 text-green-300"
              }`}>
                {h.is_main ? "MAIN" : "PARTNER"}
              </span>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-xl font-bold">{h.beds_available}</div>
                <div className="text-xs text-gray-400">Beds free</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-xl font-bold">{h.ambulances_available}</div>
                <div className="text-xs text-gray-400">Ambulances avail</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-xl font-bold">
                  {imaging.filter(m => m.available).length}/{imaging.length}
                </div>
                <div className="text-xs text-gray-400">Imaging avail</div>
              </div>
            </div>

            {/* Imaging by type */}
            {Object.keys(byType).length > 0 && (
              <div className="grid grid-cols-5 gap-2 mb-3">
                {Object.entries(byType).map(([mtype, mlist]) => {
                  const avail = mlist.filter(m => m.available).length;
                  return (
                    <div key={mtype}
                         className={`rounded-lg p-2 text-center text-xs border ${
                           avail > 0
                             ? "bg-green-950 border-green-800"
                             : "bg-red-950 border-red-800"
                         }`}>
                      <div className="text-lg">{MACHINE_ICONS[mtype] || "🔬"}</div>
                      <div className="font-medium">{mtype}</div>
                      <div className={avail > 0 ? "text-green-400" : "text-red-400"}>
                        {avail}/{mlist.length}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-gray-500">
              📍 {h.lat.toFixed(4)}, {h.lng.toFixed(4)}
            </p>
          </div>
        );
      })}

      {/* Distance matrix */}
      {hospitals.length >= 2 && (
        <div className="card">
          <h2 className="font-semibold mb-3">📍 Distance Matrix</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800">
                  <th className="text-left py-2 pr-4">From \ To</th>
                  {hospitals.map(h => (
                    <th key={h.id} className="text-left py-2 pr-4 whitespace-nowrap">
                      {h.name.split(" ").slice(0, 3).join(" ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hospitals.map(h1 => (
                  <tr key={h1.id} className="border-b border-gray-800/50">
                    <td className="py-2 pr-4 font-medium whitespace-nowrap">
                      {h1.name.split(" ").slice(0, 3).join(" ")}
                    </td>
                    {hospitals.map(h2 => (
                      <td key={h2.id} className="py-2 pr-4 text-gray-400">
                        {h1.id === h2.id ? "—" : `${hdist(h1, h2)} km`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ambulance fleet */}
      <div className="card">
        <h2 className="font-semibold mb-3">🚑 Ambulance Fleet</h2>
        {hospitals.map(h => {
          const hospAmbs = ambulances.filter(a => a.hospital_id === h.id);
          if (!hospAmbs.length) return null;
          return (
            <div key={h.id} className="mb-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">{h.name}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {hospAmbs.map(a => (
                  <div key={a.id}
                       className={`rounded-lg p-3 border text-sm ${
                         a.is_available
                           ? "bg-green-950 border-green-800"
                           : "bg-gray-800 border-gray-700"
                       }`}>
                    <div className="font-bold">{a.call_sign}</div>
                    <div className="text-gray-400 text-xs">{a.driver}</div>
                    <div className={`text-xs mt-1 font-medium ${
                      a.is_available ? "text-green-400" : "text-orange-400"
                    }`}>
                      {a.is_available ? "🟢 Available" : "🟡 On duty"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AgentLog ────────────────────────────────────────────────────────────────
export function AgentLog({ selHospId }) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await api.get("decisions", { limit: 100, hospital_id: selHospId });
      setLogs(d);
    } catch {}
    setLoading(false);
  }, [selHospId]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  async function clearLog() {
    await api.post("decisions/clear");
    setLogs([]);
  }

  const BADGE_CLASS = {
    critical: "badge-critical",
    warning:  "badge-warning",
    normal:   "badge-normal",
  };
  const BADGE_LABEL = {
    critical: "🔴 CRITICAL",
    warning:  "🟠 WARNING",
    normal:   "🟢 INFO",
  };
  const ROW_BG = {
    critical: "bg-red-950 border-red-900",
    warning:  "bg-orange-950 border-orange-900",
    normal:   "bg-gray-900 border-gray-800",
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🤖 Agent Decision Log</h1>
        <button onClick={clearLog} className="btn-danger text-sm">
          🗑️ Clear Log
        </button>
      </div>
      <p className="text-gray-400 text-sm">
        Every triage, admission, escalation, ambulance dispatch, and discharge — with full AI reasoning.
      </p>

      {logs.length ? (
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id}
                 className={`rounded-xl p-4 border ${ROW_BG[log.severity_level] || ROW_BG.normal}`}>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`badge ${BADGE_CLASS[log.severity_level] || "badge-normal"}`}>
                  {BADGE_LABEL[log.severity_level] || "INFO"}
                </span>
                <span className="bg-gray-700 text-gray-300 badge">{log.action_type}</span>
                {log.patient_name && (
                  <span className="font-medium text-sm">{log.patient_name}</span>
                )}
                <span className="text-gray-500 text-xs ml-auto">{log.time}</span>
              </div>
              <p className="text-sm text-gray-300 mb-1">
                <span className="text-gray-500">Reasoning: </span>{log.reasoning}
              </p>
              <p className="text-sm text-gray-400">
                <span className="text-gray-500">Action: </span>{log.action_taken}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-500">
          No decisions logged yet. Register a patient or run an allocation cycle.
        </div>
      )}
    </div>
  );
}

export default Imaging;
