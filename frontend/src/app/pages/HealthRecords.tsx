import { useEffect, useState } from "react";
import { FileText, Upload, AlertCircle, Download, Trash2, Eye, Image as ImageIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface HealthRecordItem {
  id: string;
  type: string;
  title: string;
  date: string;
  file: string;
  file_url?: string;
  public_id?: string;
  uploaded_at?: string;
}

interface PatientData {
  id: number;
  user_id: number;
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
  blood_group?: string;
  symptoms?: unknown[];
  health_metrics?: Record<string, unknown>;
  health_records?: HealthRecordItem[];
  prescriptions?: unknown[];
}

function normalizeRecords(records: unknown): HealthRecordItem[] {
  if (!Array.isArray(records)) return [];
  return records
    .map((record) => {
      const item = record as Partial<HealthRecordItem>;
      if (!item.title || !item.file) return null;
      const normalized: HealthRecordItem = {
        id: String(item.id ?? `${Date.now()}-${Math.random()}`),
        type: String(item.type ?? "Record"),
        title: String(item.title),
        date: String(item.date ?? new Date().toLocaleDateString()),
        file: String(item.file),
      };
      if (item.file_url) normalized.file_url = String(item.file_url);
      if (item.public_id) normalized.public_id = String(item.public_id);
      if (item.uploaded_at) normalized.uploaded_at = String(item.uploaded_at);
      return normalized;
    })
    .filter((record): record is HealthRecordItem => record !== null);
}

function inferRecordType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("xray") || lower.endsWith(".dcm")) return "X-Ray";
  if (lower.includes("mri")) return "MRI";
  if (lower.includes("ct")) return "CT Scan";
  if (lower.includes("prescription")) return "Prescription";
  if (lower.includes("blood") || lower.includes("lab")) return "Lab Report";
  return "Medical Record";
}

export function HealthRecords() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<"records" | "ai-diagnosis">("records");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showAIResults, setShowAIResults] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiTimestamp, setAiTimestamp] = useState("");
  const [aiError, setAiError] = useState("");
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [records, setRecords] = useState<HealthRecordItem[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordError, setRecordError] = useState("");
  const [recordSuccess, setRecordSuccess] = useState("");
  const [recordSaving, setRecordSaving] = useState(false);

  const [recordFile, setRecordFile] = useState<File | null>(null);
  const [recordTitle, setRecordTitle] = useState("");
  const [recordType, setRecordType] = useState("Medical Record");

  useEffect(() => {
    const fetchRecords = async () => {
      if (!user.userId) {
        setRecordError("Please login to manage health records");
        setRecordsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/patients/by-user/${user.userId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch health records");
        }
        const data: PatientData = await res.json();
        setPatient(data);
        setRecords(normalizeRecords(data.health_records));
      } catch (err) {
        setRecordError(err instanceof Error ? err.message : "Failed to fetch health records");
      } finally {
        setRecordsLoading(false);
      }
    };

    fetchRecords();
  }, [user.userId]);

  const saveRecordsToBackend = async (nextRecords: HealthRecordItem[]) => {
    if (!patient) throw new Error("Patient profile not found");

    const payload = {
      name: patient.name,
      user_id: patient.user_id,
      age: patient.age ?? null,
      gender: patient.gender ?? null,
      phone: patient.phone ?? null,
      blood_group: patient.blood_group ?? null,
      symptoms: patient.symptoms ?? [],
      health_metrics: patient.health_metrics ?? {},
      health_records: nextRecords,
      prescriptions: patient.prescriptions ?? [],
    };

    const res = await fetch(`/patients/${patient.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to save health records");
    }

    const updated: PatientData = await res.json();
    setPatient(updated);
    setRecords(normalizeRecords(updated.health_records));
  };

  const handleRecordFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setRecordFile(file);
    if (!recordTitle.trim()) {
      setRecordTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
    setRecordType(inferRecordType(file.name));
    setRecordError("");
  };

  const handleAddRecord = async () => {
    if (!recordFile) {
      setRecordError("Please choose a file to upload");
      return;
    }
    if (!recordTitle.trim()) {
      setRecordError("Please add a title for this record");
      return;
    }

    setRecordSaving(true);
    setRecordError("");
    setRecordSuccess("");
    try {
      const uploadForm = new FormData();
      uploadForm.append("file", recordFile);

      const uploadRes = await fetch("/health-records/upload", {
        method: "POST",
        body: uploadForm,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.success || !uploadData.file_url) {
        throw new Error(uploadData.error || "Cloudinary upload failed");
      }

      const newRecord: HealthRecordItem = {
        id: uploadData.public_id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: recordType,
        title: recordTitle.trim(),
        date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        file: recordFile.name,
        file_url: uploadData.file_url,
        public_id: uploadData.public_id,
        uploaded_at: uploadData.timestamp,
      };

      const nextRecords = [newRecord, ...records];
      await saveRecordsToBackend(nextRecords);
      setRecordSuccess("Record uploaded and saved successfully.");

      setRecordFile(null);
      setRecordTitle("");
      setRecordType("Medical Record");
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : "Failed to save record");
    } finally {
      setRecordSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    setRecordSaving(true);
    setRecordError("");
    setRecordSuccess("");
    try {
      const nextRecords = records.filter((record) => record.id !== id);
      await saveRecordsToBackend(nextRecords);
      setRecordSuccess("Record deleted successfully.");
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : "Failed to delete record");
    } finally {
      setRecordSaving(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setShowAIResults(false);
        setAiError("");
        setAiExplanation("");
        setAiModel("");
        setAiTimestamp("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!uploadedFile) return;

    setIsAnalyzing(true);
    setAiError("");
    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("custom_prompt", "Explain this medical report in very easy language.");

      const res = await fetch("/health-records/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze image");
      }

      setAiExplanation(data.explanation || "No explanation returned");
      setAiModel(data.model || "");
      setAiTimestamp(data.timestamp || "");
      setShowAIResults(true);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Analysis failed");
      setShowAIResults(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetAI = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setShowAIResults(false);
    setIsAnalyzing(false);
    setAiError("");
    setAiExplanation("");
    setAiModel("");
    setAiTimestamp("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl md:text-3xl lg:text-4xl text-[#1E293B] mb-3"
            style={{ fontWeight: 700 }}
          >
            Health Records
          </h1>
          <p className="text-lg text-[#64748B]">
            Manage your medical history and get AI-based image analysis
          </p>
        </div>

        {recordError && (
          <div className="mb-6 px-4 py-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
            {recordError}
          </div>
        )}

        {recordSuccess && (
          <div className="mb-6 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm">
            {recordSuccess}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl p-2 shadow-sm mb-6 inline-flex gap-2">
          <button
            onClick={() => setSelectedTab("records")}
            className={`px-6 py-3 rounded-xl transition-colors ${
              selectedTab === "records"
                ? "bg-[#4F7DF3] text-white"
                : "text-[#64748B] hover:bg-[#F8FAFC]"
            }`}
          >
            My Records
          </button>
          <button
            onClick={() => setSelectedTab("ai-diagnosis")}
            className={`px-6 py-3 rounded-xl transition-colors ${
              selectedTab === "ai-diagnosis"
                ? "bg-[#4F7DF3] text-white"
                : "text-[#64748B] hover:bg-[#F8FAFC]"
            }`}
          >
            AI Image Diagnosis
          </button>
        </div>

        {/* Content */}
        {selectedTab === "records" ? (
          <>
            {/* Upload New Record */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm mb-6">
              <h2 className="text-xl text-[#1E293B] mb-4" style={{ fontWeight: 600 }}>
                Upload New Record
              </h2>
              <div className="space-y-4">
                <label className="block border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#4F7DF3] transition-colors cursor-pointer">
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleRecordFileChange} className="hidden" />
                  <Upload className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                  <p className="text-[#1E293B] mb-2" style={{ fontWeight: 600 }}>
                    {recordFile ? `Selected: ${recordFile.name}` : "Click to upload medical file"}
                  </p>
                  <p className="text-sm text-[#64748B]">PDF, JPG, PNG up to 10MB</p>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Record title (e.g., Blood Test March 2026)"
                    value={recordTitle}
                    onChange={(e) => setRecordTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4F7DF3]"
                  />
                  <select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4F7DF3]"
                  >
                    <option>Medical Record</option>
                    <option>Prescription</option>
                    <option>Lab Report</option>
                    <option>X-Ray</option>
                    <option>MRI</option>
                    <option>CT Scan</option>
                  </select>
                </div>

                <button
                  onClick={handleAddRecord}
                  disabled={recordSaving}
                  className="w-full md:w-auto px-6 py-3 bg-[#4F7DF3] text-white rounded-xl hover:bg-[#3D6DE3] transition-colors disabled:opacity-50"
                >
                  {recordSaving ? "Uploading and Saving..." : "Save Record"}
                </button>
              </div>
            </div>

            {/* Records List */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-xl text-[#1E293B] mb-6" style={{ fontWeight: 600 }}>
                My Medical Records
              </h2>

              <div className="space-y-4">
                {recordsLoading && <p className="text-[#64748B]">Loading records...</p>}
                {!recordsLoading && records.length === 0 && (
                  <p className="text-[#64748B]">No records found. Upload your first record above.</p>
                )}
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="p-5 rounded-2xl border-2 border-gray-200 hover:border-[#4F7DF3]/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#4F7DF3]/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-[#4F7DF3]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className="text-lg text-[#1E293B]"
                                style={{ fontWeight: 600 }}
                              >
                                {record.title}
                              </h3>
                              <span className="px-2 py-1 bg-[#A7E3C9] text-[#1E293B] rounded-lg text-xs">
                                {record.type}
                              </span>
                            </div>
                            <p className="text-sm text-[#64748B]">{record.date}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                          <button
                            type="button"
                            onClick={() => {
                              if (record.file_url) window.open(record.file_url, "_blank", "noopener,noreferrer");
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#4F7DF3] text-white rounded-xl hover:bg-[#3D6DE3] transition-colors text-sm"
                            title={record.file_url || record.file}
                          >
                            <Eye className="w-4 h-4" />
                            {record.file}
                          </button>
                          {record.file_url ? (
                            <a
                              href={record.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-white text-[#4F7DF3] border-2 border-[#4F7DF3] rounded-xl hover:bg-[#F8FAFC] transition-colors text-sm"
                              download
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </a>
                          ) : (
                            <button
                              type="button"
                              className="flex items-center gap-2 px-4 py-2 bg-white text-[#4F7DF3] border-2 border-[#4F7DF3] rounded-xl hover:bg-[#F8FAFC] transition-colors text-sm"
                              title="No file URL available"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(record.id)}
                            disabled={recordSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-red-500 border-2 border-red-200 rounded-xl hover:bg-red-50 transition-colors text-sm disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* AI Image Diagnosis */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm mb-6">
              <h2 className="text-xl text-[#1E293B] mb-4" style={{ fontWeight: 600 }}>
                Upload Medical Image for AI Analysis
              </h2>

              {!uploadedImage ? (
                <label className="block border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-[#4F7DF3] transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <ImageIcon className="w-16 h-16 text-[#64748B] mx-auto mb-4" />
                  <p className="text-[#1E293B] mb-2" style={{ fontWeight: 600 }}>
                    Click to upload medical image
                  </p>
                  <p className="text-sm text-[#64748B]">
                    Supported: X-Ray, MRI, CT Scan, Skin images (JPG, PNG)
                  </p>
                </label>
              ) : (
                <div className="space-y-6">
                  {/* Image Preview */}
                  <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200">
                    <img
                      src={uploadedImage}
                      alt="Uploaded medical image"
                      className="w-full h-auto max-h-96 object-contain bg-gray-50"
                    />
                  </div>

                  {!showAIResults ? (
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <button
                          onClick={handleAnalyzeImage}
                          disabled={isAnalyzing}
                          className="flex-1 px-8 py-4 bg-[#4F7DF3] text-white rounded-2xl hover:bg-[#3D6DE3] transition-colors"
                        >
                          {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
                        </button>
                        <button
                          onClick={handleResetAI}
                          className="px-8 py-4 bg-white text-[#64748B] border-2 border-gray-200 rounded-2xl hover:bg-[#F8FAFC] transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      {aiError && (
                        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                          {aiError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* AI Results */}
                      <div className="space-y-4">
                        {aiError && (
                          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                            {aiError}
                          </div>
                        )}
                        <div className="p-5 rounded-xl bg-[#4F7DF3]/10 border border-[#4F7DF3]/30">
                          <h3
                            className="text-lg text-[#1E293B] mb-3"
                            style={{ fontWeight: 600 }}
                          >
                            AI Analysis Results
                          </h3>

                          <div className="space-y-3">
                            <div className="p-4 bg-white rounded-xl">
                              <p className="text-sm text-[#64748B] mb-2">Easy Explanation</p>
                              <p className="text-[#1E293B] whitespace-pre-wrap">{aiExplanation}</p>
                            </div>

                            

                            <div className="p-4 bg-white rounded-xl">
                              <p className="text-sm text-[#64748B] mb-1">Generated At</p>
                              <p className="text-[#1E293B]" style={{ fontWeight: 600 }}>
                                {aiTimestamp ? new Date(aiTimestamp).toLocaleString() : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="p-5 rounded-xl bg-[#FFD6A5]/20 border border-[#FFD6A5]">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-[#1E293B] flex-shrink-0" />
                            <div>
                              <p className="text-sm text-[#1E293B] mb-1" style={{ fontWeight: 600 }}>
                                Important Disclaimer
                              </p>
                              <p className="text-sm text-[#64748B]">
                                This AI suggestion is not a medical diagnosis. Please consult a
                                doctor for proper medical advice and professional interpretation
                                of medical images.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <button
                            onClick={handleResetAI}
                            className="flex-1 px-8 py-4 bg-white text-[#4F7DF3] border-2 border-[#4F7DF3] rounded-2xl hover:bg-[#F8FAFC] transition-colors"
                          >
                            Analyze Another Image
                          </button>
                          <button
                            onClick={() => (window.location.href = "/talk-to-doctor")}
                            className="flex-1 px-8 py-4 bg-[#4F7DF3] text-white rounded-2xl hover:bg-[#3D6DE3] transition-colors"
                          >
                            Consult a Doctor
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
