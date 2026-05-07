import React, { useState, useEffect } from "react";
import { api } from "./api";
import { Dashboard, Triage, Ambulance, Imaging, Network, AgentLog } from "./components";

const NAV = [
  { id: "dashboard", label: "📊 Dashboard"   },
  { id: "triage",    label: "🩺 Triage"      },
  { id: "ambulance", label: "🚑 Ambulance"   },
  { id: "imaging",   label: "🔬 Imaging"     },
  { id: "network",   label: "🌐 Network"     },
  { id: "log",       label: "🤖 Agent Log"   },
];

export default function App() {
  const [page,      setPage]      = useState("dashboard");
  const [hospitals, setHospitals] = useState([]);
  const [selHospId, setSelHospId] = useState(1);
  const [apiOk,     setApiOk]     = useState(null);

  useEffect(() => {
    api.get("health")
      .then(() => { setApiOk(true); loadHospitals(); })
      .catch(() => setApiOk(false));
    // eslint-disable-next-line
  }, []);

  async function loadHospitals() {
    try {
      const data = await api.get("hospitals");
      setHospitals(data);
      const main = data.find(h => h.is_main);
      if (main) setSelHospId(main.id);
    } catch {}
  }

  const selHosp = hospitals.find(h => h.id === selHospId);

  const PAGE_PROPS = { hospitals, selHospId, selHosp };

  if (apiOk === false) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">API Offline</h2>
        <p className="text-gray-400 mb-4">
          Start the Flask API first, then refresh this page.
        </p>
        <code className="bg-gray-800 px-3 py-2 rounded text-green-400 text-sm block">
          python api/api.py
        </code>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top Nav ───────────────────────────────────────────── */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 flex items-center gap-4 h-14">
          <span className="text-xl font-bold text-blue-400 shrink-0">🏥 HARA</span>
          <nav className="flex gap-1 overflow-x-auto">
            {NAV.map(n => (
              <button
                key={n.id}
                onClick={() => setPage(n.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                  ${page === n.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
              >
                {n.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto shrink-0">
            <select
              value={selHospId}
              onChange={e => setSelHospId(Number(e.target.value))}
              className="text-sm py-1 px-2 bg-gray-800 border border-gray-700 rounded-lg"
            >
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>
                  {h.is_main ? "🏥" : "🏨"} {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* ── Page ──────────────────────────────────────────────── */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-6">
        {apiOk === null && (
          <div className="text-center py-20 text-gray-400">Connecting to API...</div>
        )}
        {apiOk && (
          <>
            {page === "dashboard" && <Dashboard  {...PAGE_PROPS} />}
            {page === "triage"    && <Triage     {...PAGE_PROPS} />}
            {page === "ambulance" && <Ambulance  {...PAGE_PROPS} />}
            {page === "imaging"   && <Imaging    {...PAGE_PROPS} />}
            {page === "network"   && <Network    {...PAGE_PROPS} />}
            {page === "log"       && <AgentLog   {...PAGE_PROPS} />}
          </>
        )}
      </main>

      <footer className="text-center text-xs text-gray-600 py-4 border-t border-gray-800">
        HARA — Hospital Autonomous Resource Allocation Agent &nbsp;·&nbsp;
        Gemini AI · n8n · Flask · SQL Server
      </footer>
    </div>
  );
}
