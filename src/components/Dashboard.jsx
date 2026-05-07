import React, { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const SEV_ICON  = { 1:"🔵",2:"🟢",3:"🟡",4:"🟠",5:"🔴" };
const SEV_LABEL = { 1:"Trivial",2:"Minor",3:"Moderate",4:"Serious",5:"CRITICAL" };
const SEV_BG    = { 1:"bg-blue-950",2:"bg-green-950",3:"bg-yellow-950",
                    4:"bg-orange-950",5:"bg-red-950" };

function KPI({ icon, label, value, sub }) {
  return (
    <div className="card flex items-center gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-gray-400">{label}</div>
        {sub && <div className="text-xs text-gray-500">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard({ selHospId }) {
  const [status,   setStatus]   = useState({});
  const [patients, setPatients] = useState([]);
  const [wards,    setWards]    = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, p, w] = await Promise.all([
        api.get("status",       { hospital_id: selHospId }),
        api.get("patients/all", { hospital_id: selHospId }),
        api.get("wards",        { hospital_id: selHospId }),
      ]);
      setStatus(s);
      setPatients(p.patients || []);
      setWards(w);
    } catch {}
    setLoading(false);
  }, [selHospId]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const staffData = Object.entries(status.staff || {}).map(([role, counts]) => ({
    role: role.replace(" ", "\n"), available: counts.available, total: counts.total,
  }));

  async function discharge(patientId) {
    await api.post("discharge", { patient_id: patientId });
    load();
  }

  async function runCycle() {
    await api.post("run-cycle", { hospital_id: selHospId });
    load();
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📊 Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon="⏳" label="Waiting"       value={status.waiting_count  || 0} />
        <KPI icon="🛏️" label="Admitted"      value={status.admitted_count || 0} />
        <KPI icon="🔴" label="Critical"      value={status.critical_count || 0} />
        <KPI icon="👩‍⚕️" label="Staff avail"
             value={Object.values(status.staff || {}).reduce((s,v)=>s+v.available,0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient table */}
        <div className="lg:col-span-2 card overflow-auto">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">All Patients</h2>
            <button onClick={runCycle} className="btn-primary text-sm">
              ▶ Run Allocation Cycle
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left py-2 pr-3"></th>
                <th className="text-left py-2 pr-3">Name</th>
                <th className="text-left py-2 pr-3">Age</th>
                <th className="text-left py-2 pr-3 hidden md:table-cell">Condition</th>
                <th className="text-left py-2 pr-3">Status</th>
                <th className="text-left py-2 pr-3 hidden lg:table-cell">Ward / Bed</th>
                <th className="text-left py-2"></th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id}
                    className={`border-b border-gray-800/50 ${SEV_BG[p.severity] || ""}`}>
                  <td className="py-2 pr-3">{SEV_ICON[p.severity]}</td>
                  <td className="py-2 pr-3 font-medium">{p.name}</td>
                  <td className="py-2 pr-3">{p.age}</td>
                  <td className="py-2 pr-3 hidden md:table-cell text-gray-400 max-w-xs truncate">
                    {p.condition}
                  </td>
                  <td className="py-2 pr-3">
                    <span className={`badge ${
                      p.status==="admitted"    ? "badge-normal"   :
                      p.status==="waiting"     ? "badge-warning"  :
                                                 "bg-gray-700 text-gray-400"
                    }`}>{p.status}</span>
                  </td>
                  <td className="py-2 pr-3 hidden lg:table-cell text-gray-400">
                    {p.ward ? `${p.ward} / ${p.bed}` : "—"}
                  </td>
                  <td className="py-2">
                    {p.status === "admitted" && (
                      <button onClick={() => discharge(p.id)}
                              className="text-xs text-red-400 hover:text-red-300">
                        Discharge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!patients.length && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">
                  No patients on record.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Ward occupancy */}
          <div className="card">
            <h2 className="font-semibold mb-3">Ward Occupancy</h2>
            {wards.map(w => {
              const pct = w.total_beds > 0
                ? (w.total_beds - w.available_beds) / w.total_beds : 0;
              const color = pct > 0.85 ? "bg-red-500" :
                            pct > 0.6  ? "bg-orange-500" : "bg-green-500";
              return (
                <div key={w.id} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{w.name}</span>
                    <span className="text-gray-400">
                      {w.available_beds}/{w.total_beds} free
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className={`${color} h-2 rounded-full transition-all`}
                         style={{ width: `${pct * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Staff chart */}
          <div className="card">
            <h2 className="font-semibold mb-3">Staff Availability</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={staffData} barGap={2}>
                <XAxis dataKey="role" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "#1f2937", border: "1px solid #374151" }}
                />
                <Bar dataKey="available" name="Available" radius={[3,3,0,0]}>
                  {staffData.map((_, i) => (
                    <Cell key={i} fill="#22c55e" />
                  ))}
                </Bar>
                <Bar dataKey="total" name="Total" radius={[3,3,0,0]}>
                  {staffData.map((_, i) => (
                    <Cell key={i} fill="#374151" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
