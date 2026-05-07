import React, { useState } from "react";
import { api } from "../api";

const SEV_ICON  = {1:"🔵",2:"🟢",3:"🟡",4:"🟠",5:"🔴"};
const SEV_LABEL = {1:"Trivial",2:"Minor",3:"Moderate",4:"Serious",5:"CRITICAL"};
const SEV_BG    = {1:"bg-blue-950 border-blue-800",2:"bg-green-950 border-green-800",
                   3:"bg-yellow-950 border-yellow-800",4:"bg-orange-950 border-orange-800",
                   5:"bg-red-950 border-red-800"};

export default function Triage({ selHospId }) {
  const [form, setForm] = useState({
    name:"", age:30, condition:"", severity:3, notes:"",
    include_vitals: true,
    temperature:37.0, bp_systolic:120, bp_diastolic:80,
    heart_rate:80, spo2:98, height_cm:165, weight_kg:65,
  });
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const bmi = form.height_cm > 0
    ? (form.weight_kg / ((form.height_cm / 100) ** 2)).toFixed(1)
    : "—";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.condition) {
      setError("Name and condition are required."); return;
    }
    setError(""); setLoading(true); setResult(null);

    // Register patient
    const reg = await api.post("patients/add", {
      name: form.name, age: form.age, condition: form.condition,
      severity: form.severity, notes: form.notes, hospital_id: selHospId,
    });
    if (!reg.success) { setError(reg.error); setLoading(false); return; }

    // Build vitals
    const vitals = form.include_vitals ? {
      temperature: form.temperature, bp_systolic: form.bp_systolic,
      bp_diastolic: form.bp_diastolic, heart_rate: form.heart_rate,
      spo2: form.spo2, height_cm: form.height_cm, weight_kg: form.weight_kg,
    } : null;

    // Triage
    const triage = await api.post("triage", {
      patient_id: reg.patient_id, vitals,
    });
    setLoading(false);
    if (triage.success) setResult({ ...triage, patient_name: form.name });
    else setError(triage.error);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">🩺 Triage & Intake</h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Patient details */}
        <div>
          <h2 className="font-semibold mb-3 text-blue-400">Patient Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label>Full Name *</label>
              <input value={form.name} onChange={e=>set("name",e.target.value)}
                     placeholder="e.g. Thilak Perera" required />
            </div>
            <div>
              <label>Age *</label>
              <input type="number" value={form.age} min={0} max={120}
                     onChange={e=>set("age",parseInt(e.target.value)||0)} required />
            </div>
            <div className="md:col-span-2">
              <label>Presenting Condition / Chief Complaint *</label>
              <input value={form.condition}
                     onChange={e=>set("condition",e.target.value)}
                     placeholder="e.g. Severe chest pain radiating to left arm"
                     required />
            </div>
            <div className="md:col-span-2">
              <label>Additional Notes</label>
              <textarea value={form.notes} onChange={e=>set("notes",e.target.value)}
                        placeholder="Allergies, current medications, relevant history..."
                        rows={2} />
            </div>
            <div className="md:col-span-2">
              <label>Initial Severity Estimate: {form.severity} — {SEV_LABEL[form.severity]}</label>
              <input type="range" min={1} max={5} value={form.severity}
                     onChange={e=>set("severity",parseInt(e.target.value))}
                     className="w-full accent-blue-500 mt-1" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 Trivial</span><span>2 Minor</span><span>3 Moderate</span>
                <span>4 Serious</span><span>5 Critical</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vitals */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-semibold text-blue-400">📋 Vitals</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.include_vitals}
                     onChange={e=>set("include_vitals",e.target.checked)}
                     className="w-4 h-4 accent-blue-500" />
              <span className="text-sm text-gray-400">Include vitals (improves AI accuracy)</span>
            </label>
          </div>
          {form.include_vitals && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label>Temperature (°C)</label>
                <input type="number" step="0.1" min={34} max={42}
                       value={form.temperature}
                       onChange={e=>set("temperature",parseFloat(e.target.value))} />
              </div>
              <div>
                <label>BP Systolic (mmHg)</label>
                <input type="number" min={60} max={250}
                       value={form.bp_systolic}
                       onChange={e=>set("bp_systolic",parseInt(e.target.value))} />
              </div>
              <div>
                <label>BP Diastolic (mmHg)</label>
                <input type="number" min={40} max={150}
                       value={form.bp_diastolic}
                       onChange={e=>set("bp_diastolic",parseInt(e.target.value))} />
              </div>
              <div>
                <label>Heart Rate (bpm)</label>
                <input type="number" min={30} max={220}
                       value={form.heart_rate}
                       onChange={e=>set("heart_rate",parseInt(e.target.value))} />
              </div>
              <div>
                <label>SpO₂ (%)</label>
                <input type="number" min={70} max={100}
                       value={form.spo2}
                       onChange={e=>set("spo2",parseInt(e.target.value))} />
              </div>
              <div>
                <label>Height (cm)</label>
                <input type="number" step="0.5" min={50} max={220}
                       value={form.height_cm}
                       onChange={e=>set("height_cm",parseFloat(e.target.value))} />
              </div>
              <div>
                <label>Weight (kg)</label>
                <input type="number" step="0.5" min={2} max={300}
                       value={form.weight_kg}
                       onChange={e=>set("weight_kg",parseFloat(e.target.value))} />
              </div>
              <div>
                <label>BMI (auto)</label>
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-blue-400 font-bold">
                  {bmi}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? "🧠 Gemini is triaging..." : "🩺 Register & Triage Patient"}
        </button>
      </form>

      {/* Triage result */}
      {result && (
        <div className="space-y-4">
          <div className={`border rounded-xl p-5 ${SEV_BG[result.severity_score]}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{SEV_ICON[result.severity_score]}</span>
              <div>
                <h2 className="text-xl font-bold">
                  {result.severity_label} — Severity {result.severity_score}/5
                </h2>
                <p className="text-gray-300 text-sm">{result.gemini_reasoning}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-sm">
              <span className="bg-gray-900/60 rounded-lg px-3 py-1">
                👨‍⚕️ {result.doctor_referral}
              </span>
              {result.specialist_needed && (
                <span className="bg-purple-900/60 rounded-lg px-3 py-1">
                  🔬 Specialist: {result.specialist_needed}
                </span>
              )}
              {result.imaging_needed && (
                <span className="bg-blue-900/60 rounded-lg px-3 py-1">
                  📡 Imaging: {result.imaging_needed}
                </span>
              )}
              <span className="bg-gray-900/60 rounded-lg px-3 py-1">
                ⏱️ Wait: {result.estimated_wait}
              </span>
            </div>
          </div>

          {result.severity_score === 5 && (
            <div className="bg-red-950 border border-red-700 rounded-xl p-4 text-red-300 font-semibold">
              🚨 CRITICAL — Immediate action required. All senior staff alerted.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-semibold mb-3 text-green-400">🚑 First Aid Steps</h3>
              <ol className="space-y-2">
                {(result.first_aid_steps || []).map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-blue-400 font-bold shrink-0">{i+1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              <h3 className="font-semibold mt-4 mb-3 text-yellow-400">👩‍⚕️ Nurse Instructions</h3>
              <ul className="space-y-1">
                {(result.nurse_instructions || []).map((n, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-yellow-400">•</span><span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h3 className="font-semibold mb-3 text-purple-400">💊 Medicines Ordered</h3>
              <div className="space-y-3">
                {(result.medicines || []).map((m, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-3">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-sm text-blue-400">{m.dose} — {m.route}</div>
                    <div className="text-sm text-gray-400 mt-1">{m.purpose}</div>
                  </div>
                ))}
              </div>
              {result.imaging_needed && (
                <div className="mt-4 bg-blue-950 border border-blue-800 rounded-lg p-3">
                  <div className="font-medium text-blue-300">📡 Imaging Required</div>
                  <div className="text-sm text-gray-300 mt-1">
                    {result.imaging_needed} — Check Ops dashboard to confirm availability.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
