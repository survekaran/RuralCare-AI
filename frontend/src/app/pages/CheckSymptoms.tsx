import { useState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, Clock, Thermometer, Activity, Trash2, Loader2, Bot, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface SavedSymptom {
  id?: number;
  symptom_name: string;
  duration: string;
  recorded_at: string;
}

interface PatientData {
  id: number;
  user_id: number;
  name: string;
  symptoms: SavedSymptom[];
}

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  time: string;
}

export function CheckSymptoms() {
  const { user } = useAuth();

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState("");

  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ── AI Chat state ──────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const commonSymptoms = [
    { id: "fever", label: "Fever", icon: Thermometer },
    { id: "cough", label: "Cough", icon: Activity },
    { id: "headache", label: "Headache", icon: Activity },
    { id: "fatigue", label: "Fatigue", icon: Activity },
    { id: "bodyache", label: "Body Ache", icon: Activity },
    { id: "cold", label: "Cold/Runny Nose", icon: Activity },
    { id: "sore-throat", label: "Sore Throat", icon: Activity },
    { id: "nausea", label: "Nausea", icon: Activity },
    { id: "diarrhea", label: "Diarrhea", icon: Activity },
    { id: "vomiting", label: "Vomiting", icon: Activity },
    { id: "rash", label: "Skin Rash", icon: Activity },
    { id: "dizziness", label: "Dizziness", icon: Activity },
  ];

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Fetch patient data on mount
  useEffect(() => {
    const fetchPatient = async () => {
      if (!user.userId) {
        setError("Please log in as a patient to track symptoms");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/patients/by-user/${user.userId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setPatient(null);
            setLoading(false);
            return;
          }
          throw new Error("Failed to load patient data");
        }

        const data: PatientData = await res.json();
        setPatient(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load patient data");
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [user.userId]);

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId)
        ? prev.filter((id) => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  // ── Call AI analysis ──────────────────────────────────────────────────────
  const callAIAnalysis = async (symptomLabels: string[], dur: string) => {
    setChatLoading(true);
    setShowChat(true);

    // Add user message showing what was sent
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: `My symptoms: ${symptomLabels.join(", ")}\nDuration: ${dur}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/patients/ai/symptom-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptom_names: symptomLabels,
          duration: dur,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        const rawText = await res.text();
        throw new Error(`Server error: ${rawText.slice(0, 100)}...`);
      }

      if (!res.ok) {
        throw new Error(data.detail || "AI analysis failed");
      }

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "bot",
        text: data.analysis,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "bot",
        text: `Sorry, I couldn't analyze your symptoms right now. ${err instanceof Error ? err.message : "Please try again."}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Send custom follow-up message ─────────────────────────────────────────
  const handleChatSend = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    setChatInput("");
    setChatLoading(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, userMsg]);

    try {
      // Re-use the same endpoint with the follow-up as a symptom description
      const res = await fetch("/patients/ai/symptom-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptom_names: [text],
          duration: "Not specified",
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        const rawText = await res.text();
        throw new Error(`Server error: ${rawText.slice(0, 100)}...`);
      }
      
      if (!res.ok) throw new Error(data.detail || "AI failed");

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "bot",
        text: data.analysis,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "bot",
        text: `Sorry, something went wrong. ${err instanceof Error ? err.message : ""}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAddSymptom = async () => {
    if (selectedSymptoms.length === 0 || !duration) {
      setError("Please select at least one symptom and duration");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const symptomNames = selectedSymptoms.map(
        (symptomId) => commonSymptoms.find((symptom) => symptom.id === symptomId)?.label || symptomId
      );

      // Save to patient record if one exists (optional — AI works either way)
      if (patient && patient.id) {
        const res = await fetch(`/patients/${patient.id}/symptoms/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symptom_names: symptomNames,
            duration,
          }),
        });

        if (res.ok) {
          const refreshRes = await fetch(`/patients/by-user/${user.userId}`);
          if (refreshRes.ok) {
            const data: PatientData = await refreshRes.json();
            setPatient(data);
          }
          setSuccessMessage(`${symptomNames.length} symptom(s) saved & AI analysis started.`);
        } else {
          setSuccessMessage("AI analysis started (symptoms not saved — no patient profile).");
        }
      } else {
        setSuccessMessage("AI analysis started.");
      }

      setTimeout(() => setSuccessMessage(""), 3000);

      // ⚡ Always trigger AI analysis — works for everyone
      callAIAnalysis(symptomNames, duration);

      setSelectedSymptoms([]);
      setDuration("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSymptom = async (symptomName: string, recordedAt: string, symptomId?: number) => {
    if (!patient || !patient.id) return;

    setSaving(true);
    try {
      const params = new URLSearchParams();
      if (symptomId) {
        params.set("symptom_id", String(symptomId));
      } else {
        params.set("recorded_at", recordedAt);
      }
      const res = await fetch(
        `/patients/${patient.id}/symptoms/${encodeURIComponent(symptomName)}?${params.toString()}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Failed to remove symptom");

      const res2 = await fetch(`/patients/by-user/${user.userId}`);
      if (res2.ok) {
        const data: PatientData = await res2.json();
        setPatient(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove symptom");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedSymptoms([]);
    setDuration("");
    setError("");
    setSuccessMessage("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-8 md:py-12 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#64748B]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading your health data...</span>
        </div>
      </div>
    );
  }

  if (!user.userId) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-rose-700 mb-2">Login Required</h2>
            <p className="text-rose-600">Please log in as a patient to track and save symptoms.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl md:text-3xl lg:text-4xl text-[#1E293B] mb-3"
            style={{ fontWeight: 700 }}
          >
            Check Your Symptoms
          </h1>
          <p className="text-lg text-[#64748B]">
            Log your symptoms and get instant AI-powered health insights
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Input Form */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm mb-6">
          {/* Select Symptoms */}
          <div className="mb-8">
            <h2 className="text-xl text-[#1E293B] mb-4" style={{ fontWeight: 600 }}>
              What symptoms are you experiencing?
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {commonSymptoms.map((symptom) => {
                const Icon = symptom.icon;
                const isSelected = selectedSymptoms.includes(symptom.id);
                return (
                  <button
                    key={symptom.id}
                    onClick={() => toggleSymptom(symptom.id)}
                    className={`p-4 rounded-2xl border-2 transition-all ${isSelected
                      ? "border-[#4F7DF3] bg-[#4F7DF3]/5"
                      : "border-gray-200 hover:border-[#4F7DF3]/50"
                      }`}
                  >
                    <Icon
                      className="w-6 h-6 mx-auto mb-2"
                      style={{ color: isSelected ? "#4F7DF3" : "#64748B" }}
                    />
                    <p
                      className="text-sm text-center"
                      style={{
                        fontWeight: 600,
                        color: isSelected ? "#4F7DF3" : "#1E293B",
                      }}
                    >
                      {symptom.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration */}
          <div className="mb-8">
            <h2 className="text-xl text-[#1E293B] mb-4" style={{ fontWeight: 600 }}>
              How long have you had these symptoms?
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {["Less than 1 day", "1-3 days", "4-7 days", "More than 7 days"].map((option) => (
                <button
                  key={option}
                  onClick={() => setDuration(option)}
                  className={`p-4 rounded-2xl border-2 transition-all ${duration === option
                    ? "border-[#4F7DF3] bg-[#4F7DF3]/5"
                    : "border-gray-200 hover:border-[#4F7DF3]/50"
                    }`}
                >
                  <Clock
                    className="w-6 h-6 mx-auto mb-2"
                    style={{ color: duration === option ? "#4F7DF3" : "#64748B" }}
                  />
                  <p
                    className="text-sm text-center"
                    style={{
                      fontWeight: 600,
                      color: duration === option ? "#4F7DF3" : "#1E293B",
                    }}
                  >
                    {option}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleAddSymptom}
            disabled={selectedSymptoms.length === 0 || !duration || saving}
            className={`w-full px-8 py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 font-semibold ${selectedSymptoms.length === 0 || !duration || saving
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-[#4F7DF3] text-white hover:bg-[#3D6DE3]"
              }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              `Save ${selectedSymptoms.length} Symptom(s) & Get AI Insights`
            )}
          </button>
        </div>

        {/* ── AI Chat Box ─────────────────────────────────────────────────── */}
        {showChat && (
          <div className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden border border-[#4F7DF3]/20">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-[#4F7DF3] to-[#6C63FF] px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">SwasthAI Assistant</h3>
                <p className="text-white/70 text-xs">Helping you understand your symptoms</p>
              </div>
              {chatLoading && (
                <Loader2 className="w-5 h-5 text-white animate-spin ml-auto" />
              )}
            </div>

            {/* Messages */}
            <div className="max-h-[400px] overflow-y-auto px-4 py-4 space-y-4 bg-[#F8FAFC]">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] ${msg.role === "user"
                      ? "bg-[#4F7DF3] text-white rounded-2xl rounded-br-md"
                      : "bg-white text-[#1E293B] rounded-2xl rounded-bl-md border border-gray-200"
                      } px-4 py-3 shadow-sm`}
                  >
                    {msg.role === "bot" && (
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-4 h-4 text-[#4F7DF3]" />
                        <span className="text-xs font-semibold text-[#4F7DF3]">AI Assistant</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-2 ${msg.role === "user" ? "text-white/60 text-right" : "text-[#94A3B8]"}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-bl-md border border-gray-200 px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-[#4F7DF3]" />
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-[#4F7DF3] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-2 h-2 bg-[#4F7DF3] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-2 h-2 bg-[#4F7DF3] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="px-4 py-3 bg-white border-t border-gray-200">
              <form
                onSubmit={(e) => { e.preventDefault(); handleChatSend(); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a follow-up question..."
                  disabled={chatLoading}
                  className="flex-1 px-4 py-3 rounded-2xl bg-[#F1F5F9] border border-gray-200 focus:outline-none focus:border-[#4F7DF3] focus:ring-2 focus:ring-[#4F7DF3]/20 text-sm text-[#1E293B] placeholder-[#94A3B8] disabled:opacity-50 transition-all"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="p-3 rounded-2xl bg-[#4F7DF3] text-white hover:bg-[#3D6DE3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
              <p className="text-[10px] text-[#94A3B8] mt-2 text-center">
                ⚠️ This is not a medical diagnosis. Always consult a doctor for professional advice.
              </p>
            </div>
          </div>
        )}

        {/* Saved Symptoms Timeline */}
        {patient && patient.symptoms && patient.symptoms.length > 0 && (
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
            <h3 className="text-xl text-[#1E293B] mb-6" style={{ fontWeight: 600 }}>
              Symptom History
            </h3>
            <div className="space-y-3">
              {patient.symptoms
                .slice()
                .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
                .map((symptom, idx) => (
                  <div
                    key={symptom.id ?? `${symptom.symptom_name}-${symptom.recorded_at}-${idx}`}
                    className="flex items-start justify-between p-4 bg-[#F8FAFC] rounded-xl border border-[rgba(0,0,0,0.06)] hover:border-[#4F7DF3] transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-[#1E293B] font-semibold">{symptom.symptom_name}</p>
                        <span className="px-2 py-1 bg-[#4F7DF3]/10 text-[#4F7DF3] text-xs rounded-full">
                          {symptom.duration}
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8]">
                        Recorded: {new Date(symptom.recorded_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveSymptom(symptom.symptom_name, symptom.recorded_at, symptom.id)}
                      disabled={saving}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0 ml-4"
                      title="Remove symptom"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
            </div>

            {/* Disclaimer */}
            <div className="p-5 rounded-xl bg-[#4F7DF3]/10 border border-[#4F7DF3]/30 mt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-[#4F7DF3] flex-shrink-0" />
                <div>
                  <p className="text-sm text-[#1E293B]" style={{ fontWeight: 600 }}>
                    Important Disclaimer
                  </p>
                  <p className="text-sm text-[#64748B] mt-1">
                    This symptom tracker is for your records only. Please consult a healthcare professional for diagnosis and treatment.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => (window.location.href = "/talk-to-doctor")}
              className="w-full mt-6 px-8 py-4 bg-[#4F7DF3] text-white rounded-2xl hover:bg-[#3D6DE3] transition-colors font-semibold"
            >
              Consult a Doctor
            </button>
          </div>
        )}

        {/* Empty State */}
        {(!patient || !patient.symptoms || patient.symptoms.length === 0) && !loading && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <Activity className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <p className="text-lg text-[#64748B]">No symptoms recorded yet.</p>
            <p className="text-sm text-[#94A3B8] mt-2">Start by selecting your current symptoms above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
