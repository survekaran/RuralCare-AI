import { useState, useRef } from "react";
import {
  Plus, Search, Edit2, Trash2, X, Check, ChevronDown,
  AlertTriangle, MapPin, Phone, BadgeCheck, UserRound,
  Stethoscope, HeartPulse, Brain, Eye, Bone, Baby,
  FlaskConical, Ear, Syringe, CircleDot, Upload, FileCheck2,
  Video, Building2, Clock, IndianRupee,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Specialty =
  | "General Physician" | "Cardiologist" | "Neurologist" | "Dermatologist"
  | "Pediatrician" | "Orthopedist" | "Gynecologist" | "Ophthalmologist"
  | "ENT Specialist" | "Psychiatrist" | "Diabetologist" | "Oncologist" | "Other";

type Availability = "Available" | "Busy" | "On Leave";
type ConsultMode = "Video" | "In-Person" | "Both";

interface Doctor {
  id: number;
  name: string;
  specialty: Specialty;
  qualification: string;
  experience: number;
  fee: number;
  hospital: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  availability: Availability;
  consultMode: ConsultMode;
  verified: boolean;
  certificate: string | null; // filename (swap for URL once backend is ready)
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SPECIALTIES: Specialty[] = [
  "General Physician", "Cardiologist", "Neurologist", "Dermatologist",
  "Pediatrician", "Orthopedist", "Gynecologist", "Ophthalmologist",
  "ENT Specialist", "Psychiatrist", "Diabetologist", "Oncologist", "Other",
];

const specialtyIcons: Record<Specialty, React.ReactNode> = {
  "General Physician": <Stethoscope className="w-3.5 h-3.5" />,
  Cardiologist: <HeartPulse className="w-3.5 h-3.5" />,
  Neurologist: <Brain className="w-3.5 h-3.5" />,
  Dermatologist: <CircleDot className="w-3.5 h-3.5" />,
  Pediatrician: <Baby className="w-3.5 h-3.5" />,
  Orthopedist: <Bone className="w-3.5 h-3.5" />,
  Gynecologist: <UserRound className="w-3.5 h-3.5" />,
  Ophthalmologist: <Eye className="w-3.5 h-3.5" />,
  "ENT Specialist": <Ear className="w-3.5 h-3.5" />,
  Psychiatrist: <Brain className="w-3.5 h-3.5" />,
  Diabetologist: <Syringe className="w-3.5 h-3.5" />,
  Oncologist: <FlaskConical className="w-3.5 h-3.5" />,
  Other: <Stethoscope className="w-3.5 h-3.5" />,
};

const specialtyColors: Record<Specialty, string> = {
  "General Physician": "bg-blue-50 text-blue-700",
  Cardiologist: "bg-rose-50 text-rose-700",
  Neurologist: "bg-violet-50 text-violet-700",
  Dermatologist: "bg-amber-50 text-amber-700",
  Pediatrician: "bg-pink-50 text-pink-700",
  Orthopedist: "bg-orange-50 text-orange-700",
  Gynecologist: "bg-purple-50 text-purple-700",
  Ophthalmologist: "bg-cyan-50 text-cyan-700",
  "ENT Specialist": "bg-teal-50 text-teal-700",
  Psychiatrist: "bg-indigo-50 text-indigo-700",
  Diabetologist: "bg-emerald-50 text-emerald-700",
  Oncologist: "bg-red-50 text-red-700",
  Other: "bg-slate-50 text-slate-600",
};

const availabilityStyles: Record<Availability, { pill: string; dot: string }> = {
  Available:  { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400" },
  Busy:       { pill: "bg-amber-50 text-amber-700",     dot: "bg-amber-400"   },
  "On Leave": { pill: "bg-rose-50 text-rose-700",       dot: "bg-rose-400"    },
};

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED: Doctor[] = [
  { id: 1, name: "Dr. Priya Sharma",  specialty: "General Physician", qualification: "MBBS, MD",                    experience: 12, fee: 300, hospital: "City Health Clinic",          city: "Pune",      state: "Maharashtra", phone: "+91 98700 11111", email: "priya.sharma@rc.in",  availability: "Available",  consultMode: "Both",       verified: true,  certificate: "priya_sharma_cert.pdf"  },
  { id: 2, name: "Dr. Arjun Nair",    specialty: "Cardiologist",      qualification: "MBBS, MD, DM Cardiology",    experience: 18, fee: 800, hospital: "Heart Care Centre",           city: "Mumbai",    state: "Maharashtra", phone: "+91 98700 22222", email: "arjun.nair@rc.in",    availability: "Busy",       consultMode: "Video",      verified: true,  certificate: "arjun_nair_cert.pdf"    },
  { id: 3, name: "Dr. Meena Patel",   specialty: "Diabetologist",     qualification: "MBBS, MD, Fellowship DM",   experience:  9, fee: 500, hospital: "Diabetes & Wellness Clinic",  city: "Ahmedabad", state: "Gujarat",     phone: "+91 98700 33333", email: "meena.patel@rc.in",   availability: "Available",  consultMode: "Both",       verified: true,  certificate: "meena_patel_cert.pdf"   },
  { id: 4, name: "Dr. Ravi Kumar",    specialty: "Pediatrician",      qualification: "MBBS, DCH, MD Pediatrics",  experience: 14, fee: 400, hospital: "Little Stars Children Hosp", city: "Bangalore", state: "Karnataka",   phone: "+91 98700 44444", email: "ravi.kumar@rc.in",    availability: "On Leave",   consultMode: "In-Person",  verified: false, certificate: null                     },
  { id: 5, name: "Dr. Sunita Verma",  specialty: "Neurologist",       qualification: "MBBS, MD, DM Neurology",    experience: 22, fee: 900, hospital: "NeuroLife Institute",         city: "Delhi",     state: "NCR",         phone: "+91 98700 55555", email: "sunita.verma@rc.in",  availability: "Available",  consultMode: "Video",      verified: true,  certificate: "sunita_verma_cert.pdf"  },
  { id: 6, name: "Dr. Kavya Iyer",    specialty: "Gynecologist",      qualification: "MBBS, MS Obstetrics",        experience:  8, fee: 600, hospital: "Womens Care Hospital",        city: "Mumbai",    state: "Maharashtra", phone: "+91 98700 66666", email: "kavya.iyer@rc.in",    availability: "Available",  consultMode: "In-Person",  verified: true,  certificate: "kavya_iyer_cert.pdf"    },
  { id: 7, name: "Dr. Sameer Bose",   specialty: "Orthopedist",       qualification: "MBBS, MS Ortho",             experience: 16, fee: 700, hospital: "Bone & Joint Clinic",         city: "Pune",      state: "Maharashtra", phone: "+91 98700 77777", email: "sameer.bose@rc.in",   availability: "Busy",       consultMode: "Both",       verified: false, certificate: null                     },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const emptyForm = (): Omit<Doctor, "id"> => ({
  name: "", specialty: "General Physician", qualification: "", experience: 0,
  fee: 300, hospital: "", city: "", state: "", phone: "", email: "",
  availability: "Available", consultMode: "Both", verified: false, certificate: null,
});

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(1, 3).map(w => w[0]).join("").toUpperCase() || "DR";
}

// ── Certificate Upload Box ────────────────────────────────────────────────────

function CertUpload({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChange(file.name);
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Medical Certificate / Degree</label>
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
      {value ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <FileCheck2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-emerald-700 truncate">{value}</div>
            <div className="text-xs text-emerald-500">Certificate uploaded</div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-emerald-100 text-emerald-500 transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center gap-2 px-4 py-5 border-2 border-dashed border-[rgba(79,125,243,0.25)] rounded-xl hover:border-[#4F7DF3] hover:bg-[#F0F4FF] transition-colors group"
        >
          <Upload className="w-6 h-6 text-[#94A3B8] group-hover:text-[#4F7DF3] transition-colors" />
          <span className="text-sm text-[#64748B] group-hover:text-[#4F7DF3]">Click to upload PDF, JPG or PNG</span>
          <span className="text-xs text-[#94A3B8]">Degree certificate, registration card, etc.</span>
        </button>
      )}
    </div>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────

interface ModalProps {
  initial: Omit<Doctor, "id">;
  editingId: number | null;
  onSave: (d: Omit<Doctor, "id">) => void;
  onClose: () => void;
}

function DoctorModal({ initial, editingId, onSave, onClose }: ModalProps) {
  const [form, setForm] = useState<Omit<Doctor, "id">>(initial);
  const f = <K extends keyof Omit<Doctor, "id">>(k: K, v: Omit<Doctor, "id">[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const fc = "w-full px-3.5 py-2.5 border border-[rgba(0,0,0,0.1)] rounded-xl text-sm text-[#1E293B] bg-white outline-none transition focus:border-[#4F7DF3] focus:ring-2 focus:ring-[#4F7DF3]/20 placeholder:text-[#94A3B8]";
  const lc = "block text-xs font-semibold text-[#1E293B] mb-1.5";
  const sc = "text-xs font-bold tracking-wider uppercase text-[#94A3B8] pt-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-[rgba(0,0,0,0.06)] rounded-t-3xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-0.5">Doctor Admin</div>
              <h2 className="text-xl font-bold text-[#1E293B]">{editingId ? "Edit Doctor" : "Add New Doctor"}</h2>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F8FAFC] text-[#64748B]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="px-6 py-5 space-y-5">

          {/* Basic */}
          <div className={sc}>Doctor Details</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lc}>Full Name *</label>
              <input required value={form.name} onChange={e => f("name", e.target.value)} placeholder="Dr. First Last" className={fc} />
            </div>
            <div>
              <label className={lc}>Qualification *</label>
              <input required value={form.qualification} onChange={e => f("qualification", e.target.value)} placeholder="MBBS, MD" className={fc} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={lc}>Specialty *</label>
              <select required value={form.specialty} onChange={e => f("specialty", e.target.value as Specialty)} className={fc}>
                {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={lc}>Experience (yrs) *</label>
              <input required type="number" min={0} value={form.experience || ""} onChange={e => f("experience", Number(e.target.value))} placeholder="10" className={fc} />
            </div>
            <div>
              <label className={lc}>Consult Fee (&#8377;) *</label>
              <input required type="number" min={0} value={form.fee || ""} onChange={e => f("fee", Number(e.target.value))} placeholder="300" className={fc} />
            </div>
          </div>

          {/* Location */}
          <div className={sc}>Location &amp; Contact</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lc}>City *</label>
              <input required value={form.city} onChange={e => f("city", e.target.value)} placeholder="e.g. Pune" className={fc} />
            </div>
            <div>
              <label className={lc}>State *</label>
              <input required value={form.state} onChange={e => f("state", e.target.value)} placeholder="e.g. Maharashtra" className={fc} />
            </div>
          </div>
          <div>
            <label className={lc}>Hospital / Clinic *</label>
            <input required value={form.hospital} onChange={e => f("hospital", e.target.value)} placeholder="e.g. City Health Clinic" className={fc} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lc}>Phone *</label>
              <input required type="tel" value={form.phone} onChange={e => f("phone", e.target.value)} placeholder="+91 98700 00000" className={fc} />
            </div>
            <div>
              <label className={lc}>Email *</label>
              <input required type="email" value={form.email} onChange={e => f("email", e.target.value)} placeholder="doctor@swasthai.in" className={fc} />
            </div>
          </div>

          {/* Practice */}
          <div className={sc}>Practice Info</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Availability</label>
              <div className="relative">
                <select value={form.availability} onChange={e => f("availability", e.target.value as Availability)} className={fc}>
                  <option>Available</option>
                  <option>Busy</option>
                  <option>On Leave</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={lc}>Consult Mode</label>
              <div className="relative">
                <select value={form.consultMode} onChange={e => f("consultMode", e.target.value as ConsultMode)} className={fc}>
                  <option>Both</option>
                  <option>Video</option>
                  <option>In-Person</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Certificate */}
          <div className={sc}>Certificate Upload</div>
          <CertUpload value={form.certificate} onChange={v => f("certificate", v)} />

          {/* Verified toggle */}
          <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl border border-[rgba(0,0,0,0.06)]">
            <button
              type="button"
              onClick={() => f("verified", !form.verified)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.verified ? "bg-[#4F7DF3]" : "bg-[#CBD5E1]"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.verified ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <div>
              <div className="text-sm font-semibold text-[#1E293B]">Mark as Verified</div>
              <div className="text-xs text-[#94A3B8]">Shows a verified badge on patient-facing listings</div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full border border-[rgba(0,0,0,0.1)] text-[#64748B] hover:bg-[#F8FAFC] text-sm font-semibold">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-full bg-[#4F7DF3] hover:bg-[#3D6DE3] text-white text-sm font-bold shadow-[0_2px_10px_rgba(79,125,243,0.3)]">
              {editingId ? "Save Changes" : "Add Doctor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Doctor Card ───────────────────────────────────────────────────────────────

interface CardProps { doctor: Doctor; onEdit: () => void; onDelete: () => void }

function DoctorCard({ doctor, onEdit, onDelete }: CardProps) {
  const avail = availabilityStyles[doctor.availability];
  return (
    <div className="bg-white rounded-2xl border border-[rgba(79,125,243,0.08)] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(79,125,243,0.05)] hover:shadow-[0_4px_24px_rgba(79,125,243,0.12)] transition-shadow p-5 flex flex-col gap-4">

      {/* Top row: avatar + name + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] flex items-center justify-center text-[#4F7DF3] font-bold text-sm shrink-0">
            {initials(doctor.name)}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[#1E293B] text-[0.95rem]">{doctor.name}</span>
              {doctor.verified && <span title="Verified"><BadgeCheck className="w-4 h-4 text-[#4F7DF3] shrink-0" /></span>}
            </div>
            <div className="text-xs text-[#94A3B8] mt-0.5">{doctor.qualification}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#EEF2FF] text-[#4F7DF3] transition-colors" title="Edit">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-rose-50 text-rose-400 transition-colors" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Specialty + availability pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${specialtyColors[doctor.specialty]}`}>
          {specialtyIcons[doctor.specialty]}
          {doctor.specialty}
        </span>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${avail.pill}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${avail.dot}`} />
          {doctor.availability}
        </span>
        {(doctor.consultMode === "Video" || doctor.consultMode === "Both") && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
            <Video className="w-3 h-3" />Video
          </span>
        )}
      </div>

      {/* Location — prominent */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#F0F4FF] rounded-xl border border-[rgba(79,125,243,0.1)]">
        <MapPin className="w-4 h-4 text-[#4F7DF3] shrink-0" />
        <div>
          <div className="text-sm font-bold text-[#1E293B]">{doctor.city}, {doctor.state}</div>
          <div className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
            <Building2 className="w-3 h-3" />{doctor.hospital}
          </div>
        </div>
      </div>

      {/* Phone — prominent */}
      <a
        href={`tel:${doctor.phone}`}
        className="flex items-center gap-2.5 px-3 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors"
      >
        <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="text-sm font-bold text-emerald-700">{doctor.phone}</span>
      </a>

      {/* Footer: experience, fee, certificate */}
      <div className="flex items-center justify-between pt-1 border-t border-[rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 text-xs text-[#64748B]">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />{doctor.experience} yrs
          </span>
          <span className="flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5" />{doctor.fee}
          </span>
        </div>
        {doctor.certificate ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
            <FileCheck2 className="w-3 h-3" /> Cert. Uploaded
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-semibold">
            <AlertTriangle className="w-3 h-3" /> No Certificate
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function DoctorAdmin() {
  const [doctors, setDoctors] = useState<Doctor[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterSpec, setFilterSpec] = useState<"All" | Specialty>("All");
  const [filterCity, setFilterCity] = useState("All");
  const [filterAvail, setFilterAvail] = useState<"All" | Availability>("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formInitial, setFormInitial] = useState(emptyForm());
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const nextId = useRef(SEED.length + 1);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd = () => { setFormInitial(emptyForm()); setEditingId(null); setModalOpen(true); };
  const openEdit = (d: Doctor) => { const { id, ...rest } = d; setFormInitial(rest); setEditingId(id); setModalOpen(true); };

  const handleSave = (data: Omit<Doctor, "id">) => {
    if (editingId !== null) {
      setDoctors(p => p.map(d => d.id === editingId ? { ...data, id: editingId } : d));
      showToast("Doctor profile updated.");
    } else {
      setDoctors(p => [...p, { ...data, id: nextId.current++ }]);
      showToast("Doctor added successfully.");
    }
    setModalOpen(false);
  };

  const handleDelete = (id: number) => {
    setDoctors(p => p.filter(d => d.id !== id));
    setDeleteConfirm(null);
    showToast("Doctor removed.", "error");
  };

  // Unique sorted cities derived from current doctor list
  const allCities = ["All", ...Array.from(new Set(doctors.map(d => d.city))).sort()];

  const filtered = doctors.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || d.name.toLowerCase().includes(q)
      || d.specialty.toLowerCase().includes(q)
      || d.hospital.toLowerCase().includes(q)
      || d.city.toLowerCase().includes(q);
    const matchSpec  = filterSpec  === "All" || d.specialty    === filterSpec;
    const matchCity  = filterCity  === "All" || d.city         === filterCity;
    const matchAvail = filterAvail === "All" || d.availability === filterAvail;
    return matchSearch && matchSpec && matchCity && matchAvail;
  });

  // Sections to render: either the single selected city or all cities present in results
  const citiesInView = filterCity === "All"
    ? Array.from(new Set(filtered.map(d => d.city))).sort()
    : [filterCity];

  const total      = doctors.length;
  const available  = doctors.filter(d => d.availability === "Available").length;
  const verifiedCt = doctors.filter(d => d.verified).length;
  const noCert     = doctors.filter(d => !d.certificate).length;
  const citiesCount = new Set(doctors.map(d => d.city)).size;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-semibold ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
          {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-[#1E293B] mb-1">Remove Doctor?</h3>
            <p className="text-sm text-[#64748B] mb-5">This will permanently remove the doctor from the platform.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-full border border-[rgba(0,0,0,0.1)] text-[#64748B] hover:bg-[#F8FAFC] text-sm font-semibold">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold">Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {modalOpen && (
        <DoctorModal
          initial={formInitial}
          editingId={editingId}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">SwasthAI · Admin Panel</div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Doctor Management</h1>
            <p className="text-sm text-[#64748B] mt-0.5">Manage doctors by location · verify certificates</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4F7DF3] hover:bg-[#3D6DE3] text-white text-sm font-bold transition-colors shadow-[0_2px_10px_rgba(79,125,243,0.35)]"
          >
            <Plus className="w-4 h-4" /> Add Doctor
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total",          value: total,       sub: "doctors",        color: "bg-blue-50 text-[#4F7DF3]",     icon: <Stethoscope className="w-4 h-4" />    },
            { label: "Available",      value: available,   sub: "now",            color: "bg-emerald-50 text-emerald-600", icon: <Check className="w-4 h-4" />          },
            { label: "Verified",       value: verifiedCt,  sub: "doctors",        color: "bg-violet-50 text-violet-600",   icon: <BadgeCheck className="w-4 h-4" />     },
            { label: "Cities",         value: citiesCount, sub: "covered",        color: "bg-cyan-50 text-cyan-600",       icon: <MapPin className="w-4 h-4" />         },
            { label: "No Certificate", value: noCert,      sub: "pending upload", color: noCert > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400", icon: <AlertTriangle className="w-4 h-4" /> },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-[rgba(79,125,243,0.08)] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(79,125,243,0.05)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">{s.label}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
              </div>
              <div className="text-2xl font-bold text-[#1E293B]">{s.value}</div>
              <div className="text-xs text-[#94A3B8]">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-2xl border border-[rgba(79,125,243,0.08)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, specialty, hospital or city…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[rgba(0,0,0,0.08)] text-sm text-[#1E293B] bg-[#F8FAFC] outline-none focus:border-[#4F7DF3] focus:ring-2 focus:ring-[#4F7DF3]/20 placeholder:text-[#94A3B8]"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <select
                value={filterSpec}
                onChange={e => setFilterSpec(e.target.value as "All" | Specialty)}
                className="w-full pl-4 pr-8 py-2.5 rounded-xl border border-[rgba(0,0,0,0.08)] text-sm text-[#1E293B] bg-[#F8FAFC] outline-none focus:border-[#4F7DF3] appearance-none cursor-pointer"
              >
                <option value="All">All Specialties</option>
                {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
            </div>
            <div className="relative w-full sm:w-auto">
              <select
                value={filterAvail}
                onChange={e => setFilterAvail(e.target.value as "All" | Availability)}
                className="w-full pl-4 pr-8 py-2.5 rounded-xl border border-[rgba(0,0,0,0.08)] text-sm text-[#1E293B] bg-[#F8FAFC] outline-none focus:border-[#4F7DF3] appearance-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option>Available</option>
                <option>Busy</option>
                <option>On Leave</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
            </div>
          </div>

          {/* Location tab pills */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <MapPin className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            {allCities.map(city => (
              <button
                key={city}
                onClick={() => setFilterCity(city)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filterCity === city
                    ? "bg-[#4F7DF3] text-white shadow-[0_2px_8px_rgba(79,125,243,0.3)]"
                    : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
                }`}
              >
                {city === "All" ? "All Cities" : city}
                {city !== "All" && (
                  <span className={`ml-1.5 text-[10px] ${filterCity === city ? "opacity-80" : "text-[#94A3B8]"}`}>
                    ({doctors.filter(d => d.city === city).length})
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="mt-3 text-xs text-[#94A3B8]">
            Showing <span className="font-semibold text-[#1E293B]">{filtered.length}</span> of{" "}
            <span className="font-semibold text-[#1E293B]">{doctors.length}</span> doctors
          </div>
        </div>

        {/* Doctor cards — grouped by city */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-[#94A3B8]">
            <UserRound className="w-12 h-12 mx-auto mb-3 opacity-25" />
            <p className="text-sm">No doctors match your current filters.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {citiesInView.map(city => {
              const cityDoctors = filtered.filter(d => d.city === city);
              if (!cityDoctors.length) return null;
              const state = cityDoctors[0].state;
              return (
                <div key={city}>
                  {/* City section header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-[rgba(79,125,243,0.1)] shadow-sm">
                      <MapPin className="w-4 h-4 text-[#4F7DF3]" />
                      <span className="font-bold text-[#1E293B]">{city}</span>
                      <span className="text-[#94A3B8] text-sm">{state}</span>
                    </div>
                    <div className="flex-1 h-px bg-[rgba(0,0,0,0.06)]" />
                    <span className="text-xs text-[#94A3B8] font-semibold">
                      {cityDoctors.length} doctor{cityDoctors.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* 3-column card grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {cityDoctors.map(d => (
                      <DoctorCard
                        key={d.id}
                        doctor={d}
                        onEdit={() => openEdit(d)}
                        onDelete={() => setDeleteConfirm(d.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
