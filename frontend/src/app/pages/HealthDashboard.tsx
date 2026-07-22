import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

const healthData = {
  score: 74,
  name: "Arjun Mehta",
  age: 42,
  lastUpdated: "Mar 12, 2026",
  interventions: {
    dos: [
      { id: 1, text: "Take Metformin 500mg with meals, twice daily", priority: "critical" },
      { id: 2, text: "Drink at least 2.5L of water daily", priority: "high" },
      { id: 3, text: "30 min brisk walk every morning", priority: "high" },
      { id: 4, text: "Monitor blood pressure every 48 hours", priority: "medium" },
    ],
    donts: [
      { id: 1, text: "Avoid refined sugar & white carbohydrates entirely", priority: "critical" },
      { id: 2, text: "Do not skip Atorvastatin — cholesterol levels are elevated", priority: "critical" },
      { id: 3, text: "No alcohol for the next 30 days", priority: "high" },
      { id: 4, text: "Avoid high-sodium processed foods", priority: "medium" },
    ],
  },
  labReports: [
    { id: 1, test: "HbA1c", value: "7.2%", status: "warning", date: "Feb 28, 2026", range: "Normal <5.7%" },
    { id: 2, test: "LDL Cholesterol", value: "142 mg/dL", status: "danger", date: "Feb 28, 2026", range: "Normal <100 mg/dL" },
    { id: 3, test: "Blood Pressure", value: "128/84 mmHg", status: "warning", date: "Mar 10, 2026", range: "Normal <120/80" },
    { id: 4, test: "Vitamin D", value: "18 ng/mL", status: "danger", date: "Feb 28, 2026", range: "Normal 30-100 ng/mL" },
    { id: 5, test: "Creatinine", value: "0.9 mg/dL", status: "normal", date: "Feb 28, 2026", range: "Normal 0.7-1.2 mg/dL" },
    { id: 6, test: "TSH", value: "2.1 mIU/L", status: "normal", date: "Feb 28, 2026", range: "Normal 0.4-4.0 mIU/L" },
  ],
  medicines: [
    { id: 1, name: "Metformin", dose: "500mg", frequency: "Twice daily", time: "Morning & Night", stock: 14, total: 30, category: "Diabetes" },
    { id: 2, name: "Atorvastatin", dose: "20mg", frequency: "Once daily", time: "Night", stock: 8, total: 30, category: "Cholesterol" },
    { id: 3, name: "Vitamin D3", dose: "60,000 IU", frequency: "Weekly", time: "Sunday morning", stock: 3, total: 8, category: "Supplement" },
    { id: 4, name: "Telmisartan", dose: "40mg", frequency: "Once daily", time: "Morning", stock: 22, total: 30, category: "Blood Pressure" },
  ],
  dailyMandate: [
    { time: "6:30 AM", task: "Wake up & 10 min stretching", done: true, icon: "🌅" },
    { time: "7:00 AM", task: "Take Telmisartan 40mg", done: true, icon: "💊" },
    { time: "8:00 AM", task: "Breakfast + Metformin 500mg", done: true, icon: "🥗" },
    { time: "8:30 AM", task: "30 min brisk walk", done: false, icon: "🚶" },
    { time: "1:00 PM", task: "Lunch — low carb meal", done: false, icon: "🥙" },
    { time: "2:00 PM", task: "Metformin 500mg", done: false, icon: "💊" },
    { time: "6:00 PM", task: "Blood pressure check", done: false, icon: "🩺" },
    { time: "9:30 PM", task: "Atorvastatin 20mg + Vitamin D3", done: false, icon: "💊" },
    { time: "10:30 PM", task: "Sleep — 7-8 hours required", done: false, icon: "🌙" },
  ],
};

const statusConfig: Record<string, { bg: string; text: string; dot: string; badge: string }> = {
  normal: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", badge: "Normal" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", badge: "Watch" },
  danger: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", badge: "High" },
};

const priorityConfig: Record<string, { bar: string; label: string; labelColor: string }> = {
  critical: { bar: "bg-rose-500", label: "CRITICAL", labelColor: "text-rose-600 bg-rose-50" },
  high: { bar: "bg-amber-400", label: "HIGH", labelColor: "text-amber-600 bg-amber-50" },
  medium: { bar: "bg-blue-400", label: "MEDIUM", labelColor: "text-blue-600 bg-blue-50" },
};

function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 148, height: 148 }}>
      <svg width="148" height="148" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="74" cy="74" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="74" cy="74" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 36, lineHeight: 1, color }} className="font-bold">{score}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em" }} className="text-slate-400 uppercase mt-1">Health Score</span>
      </div>
    </div>
  );
}

export function HealthDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dos");
  const [checkedTasks, setCheckedTasks] = useState<Record<number, boolean>>(
    healthData.dailyMandate.reduce((acc, t, i) => ({ ...acc, [i]: t.done }), {} as Record<number, boolean>)
  );

  const toggleTask = (i: number) => setCheckedTasks((p) => ({ ...p, [i]: !p[i] }));
  const completedCount = Object.values(checkedTasks).filter(Boolean).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #F0F4FF 0%, #F8FAFC 50%, #F0FFF8 100%)",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&family=DM+Mono:wght@400;500&display=swap');

        .db-card {
          background: #FFFFFF;
          border-radius: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(79,125,243,0.06);
          border: 1px solid rgba(79,125,243,0.08);
          transition: box-shadow 0.2s;
        }
        .db-card:hover { box-shadow: 0 4px 24px rgba(79,125,243,0.12); }

        .db-pill-tab {
          padding: 7px 20px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
          border: none;
          outline: none;
          letter-spacing: 0.02em;
        }
        .db-pill-tab.active-do {
          background: #4F7DF3;
          color: white;
          box-shadow: 0 2px 12px rgba(79,125,243,0.3);
        }
        .db-pill-tab.active-dont {
          background: #f43f5e;
          color: white;
          box-shadow: 0 2px 12px rgba(244,63,94,0.3);
        }
        .db-pill-tab.inactive {
          background: #F1F5F9;
          color: #64748B;
        }

        .db-progress-bar {
          height: 4px;
          border-radius: 99px;
          background: #E2E8F0;
          overflow: hidden;
        }
        .db-progress-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.8s cubic-bezier(.4,0,.2,1);
        }

        .db-mandate-check {
          width: 22px; height: 22px;
          border-radius: 50%;
          border: 2px solid #CBD5E1;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .db-mandate-check.checked {
          background: #4F7DF3;
          border-color: #4F7DF3;
        }

        .db-score-label {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #94A3B8;
        }

        .db-section-title {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 18px;
          color: #1E293B;
          margin-bottom: 4px;
        }

        .db-tag {
          display: inline-flex; align-items: center;
          padding: 2px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .db-urgent-badge {
          background: linear-gradient(90deg, #f43f5e 0%, #fb7185 100%);
          color: white;
          padding: 3px 12px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          box-shadow: 0 2px 8px rgba(244,63,94,0.3);
          animation: db-pulse 2s infinite;
        }

        @keyframes db-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }

        .db-medicine-card {
          border-radius: 16px;
          padding: 16px;
          background: #F8FAFC;
          border: 1px solid rgba(0,0,0,0.05);
          transition: background 0.2s;
        }
        .db-medicine-card:hover { background: #F0F4FF; }
      `}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px" }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[rgba(79,125,243,0.15)] shadow-sm hover:bg-[#F0F4FF] transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-[#4F7DF3]" />
            </button>
            <div>
              <div className="db-score-label mb-1">SwasthAI · Personal Health Dashboard</div>
              <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: "#1E293B", margin: 0 }}>
                Good morning, {healthData.name} 👋
              </h1>
              <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>Last updated {healthData.lastUpdated} · Age {healthData.age}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="db-urgent-badge">⚠ 2 Urgent Actions</span>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "linear-gradient(135deg, #4F7DF3, #A7E3C9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 700, fontSize: 15,
            }}>AM</div>
          </div>
        </div>

        {/* Top Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 20 }}>

          {/* Health Score Card */}
          <div className="db-card" style={{ padding: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div className="db-score-label" style={{ alignSelf: "flex-start" }}>Overall Health Score</div>
            <ScoreRing score={healthData.score} />
            <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Diabetes", val: 62, color: "#f59e0b" },
                { label: "Cholesterol", val: 48, color: "#f43f5e" },
                { label: "BP", val: 70, color: "#f59e0b" },
                { label: "Vitamins", val: 55, color: "#f43f5e" },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>{m.label}</span>
                    <span style={{ fontSize: 11, color: m.color, fontWeight: 700 }}>{m.val}%</span>
                  </div>
                  <div className="db-progress-bar">
                    <div className="db-progress-fill" style={{ width: `${m.val}%`, background: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Urgent Interventions */}
          <div className="db-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div className="db-section-title">Urgent Interventions</div>
                <div className="db-score-label">Required actions based on your latest reports</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className={`db-pill-tab ${activeTab === "dos" ? "active-do" : "inactive"}`}
                  onClick={() => setActiveTab("dos")}
                >✓ Do's</button>
                <button
                  className={`db-pill-tab ${activeTab === "donts" ? "active-dont" : "inactive"}`}
                  onClick={() => setActiveTab("donts")}
                >✕ Don'ts</button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(activeTab === "dos" ? healthData.interventions.dos : healthData.interventions.donts).map((item) => {
                const p = priorityConfig[item.priority];
                return (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: item.priority === "critical" ? (activeTab === "dos" ? "#F0F4FF" : "#FFF1F2") : "#F8FAFC",
                    border: `1px solid ${item.priority === "critical" ? (activeTab === "dos" ? "rgba(79,125,243,0.15)" : "rgba(244,63,94,0.15)") : "rgba(0,0,0,0.05)"}`,
                  }}>
                    <div style={{ width: 3, height: 36, borderRadius: 99, flexShrink: 0 }} className={p.bar} />
                    <span style={{ fontSize: 14, color: "#1E293B", flex: 1, fontWeight: item.priority === "critical" ? 500 : 400 }}>{item.text}</span>
                    <span className={`db-tag ${p.labelColor}`}>{p.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Middle Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 20 }}>

          {/* Lab Reports */}
          <div className="db-card" style={{ padding: 24 }}>
            <div className="db-section-title">Recent Lab Reports</div>
            <div className="db-score-label" style={{ marginBottom: 16 }}>Feb–Mar 2026 · Pathcare Diagnostics</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {healthData.labReports.map((r) => {
                const s = statusConfig[r.status];
                return (
                  <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl ${s.bg}`} style={{ borderRadius: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0 }} className={s.dot} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: "#1E293B" }}>{r.test}</span>
                        <span style={{ fontWeight: 700, fontSize: 13 }} className={s.text}>{r.value}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{r.range} · {r.date}</div>
                    </div>
                    <span className={`db-tag ${s.text} ${s.bg}`} style={{ border: `1px solid currentColor`, opacity: 0.8 }}>{s.badge}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Mandate */}
          <div className="db-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div className="db-section-title">Daily Health Mandate</div>
                <div className="db-score-label">Today · March 12, 2026</div>
              </div>
              <div style={{
                background: "linear-gradient(135deg, #4F7DF3, #A7E3C9)",
                borderRadius: 12, padding: "6px 14px",
                color: "white", fontSize: 13, fontWeight: 600,
              }}>
                {completedCount}/{healthData.dailyMandate.length}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div className="db-progress-bar" style={{ height: 6 }}>
                <div className="db-progress-fill" style={{
                  width: `${(completedCount / healthData.dailyMandate.length) * 100}%`,
                  background: "linear-gradient(90deg, #4F7DF3, #A7E3C9)",
                }} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 380, overflowY: "auto" }}>
              {healthData.dailyMandate.map((t, i) => (
                <div
                  key={i}
                  onClick={() => toggleTask(i)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "10px 12px", borderRadius: 12, cursor: "pointer",
                    background: checkedTasks[i] ? "#F0FFF8" : "#F8FAFC",
                    border: `1px solid ${checkedTasks[i] ? "rgba(34,197,94,0.15)" : "rgba(0,0,0,0.04)"}`,
                    transition: "all 0.15s",
                    opacity: checkedTasks[i] ? 0.75 : 1,
                  }}
                >
                  <span style={{ fontSize: 16, marginTop: 1 }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 500, color: "#1E293B",
                      textDecoration: checkedTasks[i] ? "line-through" : "none",
                    }}>{t.task}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{t.time}</div>
                  </div>
                  <div className={`db-mandate-check ${checkedTasks[i] ? "checked" : ""}`}>
                    {checkedTasks[i] && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Medicine Record */}
        <div className="db-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div className="db-section-title">My Medicine Record</div>
              <div className="db-score-label">Current prescriptions & supplement schedule</div>
            </div>
            <button style={{
              background: "#4F7DF3", color: "white",
              border: "none", borderRadius: 12, padding: "8px 18px",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>+ Add Medicine</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {healthData.medicines.map((m) => {
              const stockPct = (m.stock / m.total) * 100;
              const stockColor = stockPct <= 30 ? "#f43f5e" : stockPct <= 60 ? "#f59e0b" : "#22c55e";
              return (
                <div key={m.id} className="db-medicine-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18,
                    }}>💊</div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                      padding: "2px 8px", borderRadius: 999,
                      background: "#EEF2FF", color: "#4F7DF3",
                    }}>{m.category}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1E293B", marginBottom: 2 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginBottom: 1 }}>{m.dose} · {m.frequency}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>🕐 {m.time}</div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: "#64748B" }}>Stock remaining</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: stockColor }}>{m.stock}/{m.total} tablets</span>
                    </div>
                    <div className="db-progress-bar">
                      <div className="db-progress-fill" style={{ width: `${stockPct}%`, background: stockColor }} />
                    </div>
                    {stockPct <= 30 && (
                      <div style={{ fontSize: 10, color: "#f43f5e", fontWeight: 600, marginTop: 6 }}>⚠ Low stock — reorder soon</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
