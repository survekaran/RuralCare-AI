import { useState } from "react";
import { Heart, User, Stethoscope, Pill, ArrowLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ─── Shared field components ───────────────────────────────────────────────

function Field({
  label, type, value, onChange, placeholder, required = false,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[0.8rem] font-semibold text-[#1E293B] mb-1.5 font-sans">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <input
        type={type} required={required} value={value}
        onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3.5 py-2.5 border-[1.5px] border-[rgba(0,0,0,0.1)] rounded-[10px] outline-none text-[0.9rem] text-[#1E293B] bg-white font-sans transition-all duration-200 focus:border-[#4F7DF3] focus:ring-2 focus:ring-[#4F7DF3]/20 placeholder:text-[#64748B]"
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, options, required = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[0.8rem] font-semibold text-[#1E293B] mb-1.5 font-sans">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <select
        required={required} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 border-[1.5px] border-[rgba(0,0,0,0.1)] rounded-[10px] outline-none text-[0.9rem] text-[#1E293B] bg-white font-sans transition-all duration-200 focus:border-[#4F7DF3] focus:ring-2 focus:ring-[#4F7DF3]/20"
      >
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── Role config ────────────────────────────────────────────────────────────

type Role = "patient" | "doctor" | "pharmacy";
type SignupStep = "role" | "credentials" | "profile";

const ROLES: { id: Role; label: string; subtitle: string; color: string; icon: React.ReactNode }[] = [
  { id: "patient",  label: "Patient",        subtitle: "Track your health & consult doctors",  color: "#4F7DF3", icon: <User className="w-5 h-5" /> },
  { id: "doctor",   label: "Doctor",         subtitle: "Manage patients & consultations",       color: "#10B981", icon: <Stethoscope className="w-5 h-5" /> },
  { id: "pharmacy", label: "Pharmacy Admin", subtitle: "Manage medicine inventory",             color: "#F59E0B", icon: <Pill className="w-5 h-5" /> },
];

// ─── Main component ─────────────────────────────────────────────────────────

interface SwasthyaAuthProps { onClose?: () => void }

export default function SwasthyaAuth({ onClose }: SwasthyaAuthProps = {}) {
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // login
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  // signup – step machine
  const [signupStep, setSignupStep]     = useState<SignupStep>("role");
  const [selectedRole, setSelectedRole] = useState<Role>("patient");

  const [creds, setCreds] = useState({ name: "", email: "", password: "" });

  const [patientP, setPatientP] = useState({
    age: "", gender: "", phone: "", blood_group: "", height: "", weight: "",
  });
  const [doctorP, setDoctorP] = useState({
    phone: "", qualification: "", specialty: "",
    experience: "", fee: "", hospital: "", city: "", state: "",
  });
  const [pharmacyP, setPharmacyP] = useState({
    phone: "", store_name: "", degree: "", license_number: "",
    address: "", city: "", state: "", pincode: "", opening_hours: "",
  });

  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const accentColor = ROLES.find((r) => r.id === selectedRole)?.color ?? "#4F7DF3";

  const resetSignup = () => {
    setSignupStep("role");
    setSelectedRole("patient");
    setCreds({ name: "", email: "", password: "" });
    setPatientP({ age: "", gender: "", phone: "", blood_group: "", height: "", weight: "" });
    setDoctorP({ phone: "", qualification: "", specialty: "", experience: "", fee: "", hospital: "", city: "", state: "" });
    setPharmacyP({ phone: "", store_name: "", degree: "", license_number: "", address: "", city: "", state: "", pincode: "", opening_hours: "" });
    setError(""); setSuccess("");
  };

  const switchTab = (tab: "login" | "signup") => {
    setActiveTab(tab); setError(""); setSuccess("");
    if (tab === "signup") resetSignup();
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res  = await fetch("/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginData) });
      const data = await res.json();
      if (!res.ok) { setError(data.detail ?? "Login failed"); return; }
      setSuccess(`Welcome back, ${data.name}!`);
      login({ name: data.name, email: data.email, phone: "", role: data.role ?? "patient", userId: data.id });
      setTimeout(() => onClose?.(), 900);
    } catch { setError("Could not reach the server. Is the backend running?"); }
    finally   { setLoading(false); }
  };

  // ── Signup step 2 → 3 (credentials → profile) ─────────────────────────────
  const handleCredentialsNext = (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (creds.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setSignupStep("profile");
  };

  // ── Signup final submit ────────────────────────────────────────────────────
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      // 1. Create auth user
      const authRes  = await fetch("/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...creds, role: selectedRole }) });
      const authData = await authRes.json();
      if (!authRes.ok) { setError(authData.detail ?? "Signup failed"); return; }

      // 2. Create role-specific profile record
      if (selectedRole === "patient") {
        const { height, weight, ...rest } = patientP;
        await fetch("/patients/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name:        creds.name,
            user_id:     authData.id,
            age:         rest.age         ? parseInt(rest.age)           : null,
            gender:      rest.gender      || null,
            phone:       rest.phone       || null,
            blood_group: rest.blood_group || null,
            health_metrics: {
              ...(height ? { height: parseFloat(height) } : {}),
              ...(weight ? { weight: parseFloat(weight) } : {}),
            },
          }),
        });
      } else if (selectedRole === "doctor") {
        await fetch("/doctors/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name:          creds.name,
            email:         creds.email,
            qualification: doctorP.qualification,
            specialty:     doctorP.specialty,
            experience:    doctorP.experience ? parseInt(doctorP.experience) : 0,
            fee:           doctorP.fee        ? parseFloat(doctorP.fee)      : 0,
            hospital:      doctorP.hospital,
            city:          doctorP.city,
            state:         doctorP.state,
            phone:         doctorP.phone,
          }),
        });
      } else if (selectedRole === "pharmacy") {
        await fetch("/pharmacies/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id:         authData.id,
            pharmacist_name: creds.name,
            store_name:      pharmacyP.store_name,
            degree:          pharmacyP.degree,
            license_number:  pharmacyP.license_number,
            phone:           pharmacyP.phone,
            email:           creds.email,
            address:         pharmacyP.address,
            city:            pharmacyP.city,
            state:           pharmacyP.state,
            pincode:         pharmacyP.pincode,
            opening_hours:   pharmacyP.opening_hours,
          }),
        });
      }

      setSuccess(`Account created! Welcome, ${authData.name} 🎉`);
      login({ name: authData.name, email: authData.email, phone: selectedRole === "pharmacy" ? pharmacyP.phone : "", role: selectedRole, userId: authData.id });
      setTimeout(() => onClose?.(), 1400);
    } catch { setError("Could not reach the server. Is the backend running?"); }
    finally   { setLoading(false); }
  };

  // ─── Heading text per step ─────────────────────────────────────────────────
  const heading = activeTab === "login" ? "Welcome back"
    : signupStep === "role"        ? "Join SwasthAI"
    : signupStep === "credentials" ? "Create your account"
    : "Complete your profile";

  const subheading = activeTab === "login"
    ? "Access your personalized health dashboard."
    : signupStep === "role"
    ? "Choose your role to get started."
    : signupStep === "credentials"
    ? `Signing up as ${selectedRole === "patient" ? "a Patient" : selectedRole === "doctor" ? "a Doctor" : "Pharmacy Admin"}`
    : `Almost done — fill in your ${selectedRole === "pharmacy" ? "pharmacy" : selectedRole} details.`;

  // ─── Role badge (reused in steps 2 & 3) ───────────────────────────────────
  const RoleBadge = ({ onBack }: { onBack: () => void }) => (
    <div className="flex items-center gap-2 -mt-1 mb-1">
      <button type="button" onClick={onBack}
        className="flex items-center gap-1 text-[0.78rem] text-[#64748B] hover:text-[#1E293B] bg-transparent border-none cursor-pointer font-sans transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>
      <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-semibold"
        style={{ backgroundColor: `${accentColor}18`, color: accentColor }}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
        {selectedRole === "patient" ? "Patient" : selectedRole === "doctor" ? "Doctor" : "Pharmacy"}
      </div>
    </div>
  );

  return (
    <div className="w-full bg-[#F8FAFC] relative overflow-hidden text-[#1E293B]">

      {/* Logo */}
      <div className="text-center mb-6 pt-1">
        <a href="/" className="inline-flex items-center gap-2.5 no-underline">
          <div className="w-[38px] h-[38px] rounded-full bg-[#4F7DF3] flex items-center justify-center shadow-[0_4px_12px_rgba(79,125,243,0.35)]">
            <Heart className="w-5 h-5 text-white" fill="white" />
          </div>
          <span className="text-2xl font-bold text-[#1E293B] tracking-tight">SwasthAI</span>
        </a>
        <h2 className="mt-4 font-sans text-[1.3rem] font-semibold text-[#1E293B]">{heading}</h2>
        <p className="text-[0.82rem] text-[#64748B] font-sans mt-1">{subheading}</p>
      </div>

      {/* Tabs */}
      <div className="flex mb-6 bg-[#F8FAFC] rounded-full p-1 border border-[rgba(0,0,0,0.06)]">
        {(["login", "signup"] as const).map((tab) => (
          <button key={tab} onClick={() => switchTab(tab)}
            className={`flex-1 py-2.5 rounded-full border-none cursor-pointer font-sans font-semibold text-[0.9rem] transition-all duration-200 ${
              activeTab === tab
                ? "bg-[#4F7DF3] text-white shadow-[0_2px_8px_rgba(79,125,243,0.35)]"
                : "bg-transparent text-[#64748B] hover:text-[#1E293B]"
            }`}>
            {tab === "login" ? "Log In" : "Sign Up"}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {success && (
        <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-[10px] text-[0.85rem] text-emerald-800 font-sans">✓ {success}</div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-[10px] text-[0.85rem] text-rose-700 font-sans">{error}</div>
      )}

      {/* ══════════════════════════ LOGIN FORM ══════════════════════════════ */}
      {activeTab === "login" && (
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Field label="Email Address" type="email"    value={loginData.email}    onChange={(v) => setLoginData({ ...loginData, email: v })}    placeholder="you@example.com" required />
          <Field label="Password"      type="password" value={loginData.password} onChange={(v) => setLoginData({ ...loginData, password: v })} placeholder="••••••••"       required />
          <button type="submit" disabled={loading}
            className="mt-2 w-full py-3 bg-[#4F7DF3] hover:bg-[#3D6DE3] disabled:opacity-60 disabled:cursor-not-allowed text-white border-none rounded-full text-[0.95rem] font-bold font-sans cursor-pointer shadow-[0_4px_12px_rgba(79,125,243,0.35)] transition-all duration-200 hover:-translate-y-px">
            {loading ? "Logging in…" : "Log In"}
          </button>
        </form>
      )}

      {/* ══════════════════════════ STEP 1: ROLE ════════════════════════════ */}
      {activeTab === "signup" && signupStep === "role" && (
        <div className="flex flex-col gap-3">
          {ROLES.map((r) => (
            <button key={r.id} type="button"
              onClick={() => { setSelectedRole(r.id); setSignupStep("credentials"); setError(""); }}
              className="w-full flex items-center gap-4 px-4 py-4 bg-white border-[1.5px] border-[rgba(0,0,0,0.08)] rounded-[12px] cursor-pointer text-left transition-all duration-200 hover:border-[#4F7DF3] hover:shadow-[0_2px_12px_rgba(79,125,243,0.12)] group">
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors"
                style={{ backgroundColor: `${r.color}15`, color: r.color }}>
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[0.95rem] text-[#1E293B]">{r.label}</div>
                <div className="text-[0.78rem] text-[#64748B] mt-0.5">{r.subtitle}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#4F7DF3] shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* ══════════════════════════ STEP 2: CREDENTIALS ═════════════════════ */}
      {activeTab === "signup" && signupStep === "credentials" && (
        <form onSubmit={handleCredentialsNext} className="flex flex-col gap-4">
          <RoleBadge onBack={() => setSignupStep("role")} />
          <Field label="Full Name"      type="text"     value={creds.name}     onChange={(v) => setCreds({ ...creds, name: v })}     placeholder="Jane Doe"           required />
          <Field label="Email Address"  type="email"    value={creds.email}    onChange={(v) => setCreds({ ...creds, email: v })}    placeholder="you@example.com"    required />
          <Field label="Password"       type="password" value={creds.password} onChange={(v) => setCreds({ ...creds, password: v })} placeholder="Min. 6 characters" required />
          <button type="submit"
            className="mt-2 w-full py-3 text-white border-none rounded-full text-[0.95rem] font-bold font-sans cursor-pointer shadow-md transition-all duration-200 hover:-translate-y-px"
            style={{ backgroundColor: accentColor }}>
            Continue →
          </button>
        </form>
      )}

      {/* ══════════════════════════ STEP 3: PROFILE ═════════════════════════ */}
      {activeTab === "signup" && signupStep === "profile" && (
        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
          <RoleBadge onBack={() => setSignupStep("credentials")} />

          {/* ── Patient fields ── */}
          {selectedRole === "patient" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Age"    type="number" value={patientP.age}    onChange={(v) => setPatientP({ ...patientP, age: v })}    placeholder="25" />
                <SelectField label="Gender" value={patientP.gender}    onChange={(v) => setPatientP({ ...patientP, gender: v })}       options={["Male", "Female", "Other"]} />
              </div>
              <Field label="Phone Number" type="tel" value={patientP.phone} onChange={(v) => setPatientP({ ...patientP, phone: v })} placeholder="+91 9876543210" />
              <SelectField label="Blood Group" value={patientP.blood_group} onChange={(v) => setPatientP({ ...patientP, blood_group: v })} options={["A+","A-","B+","B-","AB+","AB-","O+","O-"]} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Height (cm)" type="number" value={patientP.height} onChange={(v) => setPatientP({ ...patientP, height: v })} placeholder="170" />
                <Field label="Weight (kg)" type="number" value={patientP.weight} onChange={(v) => setPatientP({ ...patientP, weight: v })} placeholder="65" />
              </div>
            </>
          )}

          {/* ── Doctor fields ── */}
          {selectedRole === "doctor" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Qualification" type="text" value={doctorP.qualification} onChange={(v) => setDoctorP({ ...doctorP, qualification: v })} placeholder="MBBS, MD"    required />
                <Field label="Specialty"     type="text" value={doctorP.specialty}     onChange={(v) => setDoctorP({ ...doctorP, specialty: v })}     placeholder="Cardiology" required />
              </div>
              <Field label="Phone Number" type="tel" value={doctorP.phone} onChange={(v) => setDoctorP({ ...doctorP, phone: v })} placeholder="+91 9876543210" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Experience (yrs)"     type="number" value={doctorP.experience} onChange={(v) => setDoctorP({ ...doctorP, experience: v })} placeholder="5" />
                <Field label="Consultation Fee (₹)" type="number" value={doctorP.fee}        onChange={(v) => setDoctorP({ ...doctorP, fee: v })}        placeholder="500" />
              </div>
              <Field label="Hospital / Clinic" type="text" value={doctorP.hospital} onChange={(v) => setDoctorP({ ...doctorP, hospital: v })} placeholder="City General Hospital" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="City"  type="text" value={doctorP.city}  onChange={(v) => setDoctorP({ ...doctorP, city: v })}  placeholder="Mumbai" />
                <Field label="State" type="text" value={doctorP.state} onChange={(v) => setDoctorP({ ...doctorP, state: v })} placeholder="Maharashtra" />
              </div>
            </>
          )}

          {/* ── Pharmacy fields ── */}
          {selectedRole === "pharmacy" && (
            <>
              <Field label="Phone Number" type="tel"  value={pharmacyP.phone}      onChange={(v) => setPharmacyP({ ...pharmacyP, phone: v })}      placeholder="+91 9876543210" required />
              <Field label="Store / Shop Name" type="text" value={pharmacyP.store_name} onChange={(v) => setPharmacyP({ ...pharmacyP, store_name: v })} placeholder="Sharma Medical Store" required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Degree / Qualification" type="text" value={pharmacyP.degree} onChange={(v) => setPharmacyP({ ...pharmacyP, degree: v })} placeholder="D.Pharm / B.Pharm" required />
                <Field label="License Number" type="text" value={pharmacyP.license_number} onChange={(v) => setPharmacyP({ ...pharmacyP, license_number: v })} placeholder="PH-2026-001" required />
              </div>
              <Field label="Store Address" type="text" value={pharmacyP.address} onChange={(v) => setPharmacyP({ ...pharmacyP, address: v })} placeholder="Main Market Road, Near Bus Stand" required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="City"  type="text" value={pharmacyP.city}  onChange={(v) => setPharmacyP({ ...pharmacyP, city: v })}  placeholder="Mumbai" required />
                <Field label="State" type="text" value={pharmacyP.state} onChange={(v) => setPharmacyP({ ...pharmacyP, state: v })} placeholder="Maharashtra" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pincode" type="text" value={pharmacyP.pincode} onChange={(v) => setPharmacyP({ ...pharmacyP, pincode: v })} placeholder="400001" />
                <Field label="Opening Hours" type="text" value={pharmacyP.opening_hours} onChange={(v) => setPharmacyP({ ...pharmacyP, opening_hours: v })} placeholder="8 AM - 10 PM" />
              </div>
              <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-[10px] text-[0.8rem] text-amber-800 font-sans">
                ℹ️ After sign-up you'll manage your medicine inventory from the Pharmacy Admin dashboard.
              </div>
            </>
          )}

          <button type="submit" disabled={loading}
            className="mt-1 w-full py-3 text-white border-none rounded-full text-[0.95rem] font-bold font-sans cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-px"
            style={{ backgroundColor: accentColor }}>
            {loading ? "Creating account…" : "Complete Sign Up"}
          </button>
        </form>
      )}

      <p className="text-center text-xs text-[#64748B] mt-5 font-sans">
        By continuing, you agree to our{" "}
        <a href="#" className="text-[#4F7DF3] no-underline hover:underline">Terms</a>
        {" "}and{" "}
        <a href="#" className="text-[#4F7DF3] no-underline hover:underline">Privacy Policy</a>.
      </p>
    </div>
  );
}
