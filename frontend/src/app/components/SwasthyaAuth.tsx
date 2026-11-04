import { useState, type ReactNode, type FormEvent } from "react";
import {
  Heart,
  User,
  Stethoscope,
  Pill,
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ─── Shared field components ───────────────────────────────────────────────

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  required = false,
  showPassword,
  onTogglePassword,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}) {
  const isPassword = type === "password";
  const inputType =
    isPassword && showPassword ? "text" : type;

  return (
    <div>
      <label className="block text-[0.8rem] font-semibold text-[#1E293B] mb-1.5 font-sans">
        {label}        {required && <span className="text-rose-500 ml-0.5">*</span>}      </label>

      <div className="relative">
        <input
          type={inputType}          required={required}          value={value}          onChange={(e) => onChange(e.target.value)}          placeholder={placeholder}          className={`w-full px-3.5 py-2.5 ${
            isPassword ? "pr-11" : ""
          } border-[1.5px] border-[rgba(0,0,0,0.1)] rounded-[10px] outline-none text-[0.9rem] text-[#1E293B] bg-white font-sans transition-all duration-200 focus:border-[#4F7DF3] focus:ring-2 focus:ring-[#4F7DF3]/20 placeholder:text-[#64748B]`}        />

        {isPassword && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}            aria-label={showPassword ? "Hide password" : "Show password"}            title={showPassword ? "Hide password" : "Show password"}            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#4F7DF3] bg-transparent border-none cursor-pointer p-1 flex items-center justify-center"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}          </button>
        )}      </div>
    </div>
  );
}function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[0.8rem] font-semibold text-[#1E293B] mb-1.5 font-sans">
        {label}        {required && <span className="text-rose-500 ml-0.5">*</span>}      </label>

      <select
        required={required}        value={value}        onChange={(e) => onChange(e.target.value)}        className="w-full px-3.5 py-2.5 border-[1.5px] border-[rgba(0,0,0,0.1)] rounded-[10px] outline-none text-[0.9rem] text-[#1E293B] bg-white font-sans transition-all duration-200 focus:border-[#4F7DF3] focus:ring-2 focus:ring-[#4F7DF3]/20"
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}          </option>
        ))}      </select>
    </div>
  );
}// ─── Role config ────────────────────────────────────────────────────────────

type Role = "patient" | "doctor" | "pharmacy";
type SignupStep = "role" | "credentials" | "profile";

const ROLES: {
  id: Role;
  label: string;
  subtitle: string;
  color: string;
  icon: ReactNode;
}[] = [
  {
    id: "patient",
    label: "Patient",
    subtitle: "Track your health & consult doctors",
    color: "#4F7DF3",
    icon: <User className="w-5 h-5" />,
  },
  {
    id: "doctor",
    label: "Doctor",
    subtitle: "Doctor accounts require admin approval",
    color: "#10B981",
    icon: <Stethoscope className="w-5 h-5" />,
  },
  {
    id: "pharmacy",
    label: "Pharmacy Admin",
    subtitle: "Pharmacy accounts require admin approval",
    color: "#F59E0B",
    icon: <Pill className="w-5 h-5" />,
  },
];

interface SwasthyaAuthProps {
  onClose?: () => void;
}// ─── API helpers ────────────────────────────────────────────────────────────

async function readApiResponse(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail || data.message || `Request failed (${response.status})`
    );
  }  return data;
}async function authenticateUser(email: string, password: string) {
  const response = await fetch("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  return readApiResponse(response);
}// ─── Main component ─────────────────────────────────────────────────────────

export default function SwasthyaAuth({
  onClose,
}: SwasthyaAuthProps = {}) {
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [signupStep, setSignupStep] = useState<SignupStep>("role");
  const [selectedRole, setSelectedRole] = useState<Role>("patient");

  const [creds, setCreds] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [patientP, setPatientP] = useState({
    age: "",
    gender: "",
    phone: "",
    blood_group: "",
    height: "",
    weight: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const accentColor =
    ROLES.find((role) => role.id === selectedRole)?.color ?? "#4F7DF3";

  const resetSignup = () => {
    setSignupStep("role");
    setSelectedRole("patient");
    setShowSignupPassword(false);

    setCreds({
      name: "",
      email: "",
      password: "",
    });

    setPatientP({
      age: "",
      gender: "",
      phone: "",
      blood_group: "",
      height: "",
      weight: "",
    });

    setError("");
    setSuccess("");
  };

  const switchTab = (tab: "login" | "signup") => {
    setActiveTab(tab);
    setError("");
    setSuccess("");
    setShowLoginPassword(false);
    setShowSignupPassword(false);

    if (tab === "signup") {
      resetSignup();
    }  };

  // ─── Login ────────────────────────────────────────────────────────────────

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await authenticateUser(
        loginData.email.trim(),
        loginData.password
      );

      const token = data.access_token;
      const user = data.user ?? data;

      if (!token) {
        throw new Error(
          "The login response did not contain an access token. Check your backend /auth/login response."
        );
      }      if (!user.id || !user.email) {
        throw new Error(
          "Login succeeded, but user information was missing from the API response."
        );
      }      login(
        {
          name: user.name ?? "",
          email: user.email,
          phone: user.phone ?? "",
          role: user.role ?? "patient",
          userId: user.id,
        },
        token
      );

      setSuccess(`Welcome back, ${user.name ?? user.email}!`);

      setTimeout(() => onClose?.(), 900);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not reach the server. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }  };

  // ─── Signup step 2 → 3 ────────────────────────────────────────────────────

  const handleCredentialsNext = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (creds.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }    if (!creds.name.trim()) {
      setError("Please enter your full name.");
      return;
    }    if (!creds.email.trim()) {
      setError("Please enter your email address.");
      return;
    }    setSignupStep("profile");
  };

  // ─── Signup final submit ──────────────────────────────────────────────────

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (selectedRole !== "patient") {
        throw new Error(
          "Doctor and pharmacy accounts must be created or approved by an administrator."
        );
      }      const signupResponse = await fetch("/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: creds.name.trim(),
          email: creds.email.trim().toLowerCase(),
          password: creds.password,
        }),
      });

      const authData = await readApiResponse(signupResponse);

      if (!authData.id) {
        throw new Error(
          "Account was created, but the server did not return a user ID."
        );
      }      const tokenData = await authenticateUser(
        creds.email.trim().toLowerCase(),
        creds.password
      );

      const token = tokenData.access_token;
      const user = tokenData.user ?? authData;

      if (!token) {
        throw new Error(
          "Account created, but the server did not return an access token."
        );
      }      const { height, weight, ...rest } = patientP;

      const patientResponse = await fetch("/patients/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: creds.name.trim(),
          user_id: authData.id,
          age: rest.age ? parseInt(rest.age, 10) : null,
          gender: rest.gender || null,
          phone: rest.phone || null,
          blood_group: rest.blood_group || null,
          health_metrics: {
            ...(height ? { height: parseFloat(height) } : {}),
            ...(weight ? { weight: parseFloat(weight) } : {}),
          },
        }),
      });

      await readApiResponse(patientResponse);

      login(
        {
          name: user.name ?? creds.name.trim(),
          email: user.email ?? creds.email.trim().toLowerCase(),
          phone: patientP.phone || user.phone || "",
          role: user.role ?? "patient",
          userId: user.id ?? authData.id,
        },
        token
      );

      setSuccess(
        `Account created! Welcome, ${authData.name ?? creds.name} 🎉`
      );

      setTimeout(() => onClose?.(), 1400);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not reach the server. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }  };

  // ─── Heading text ─────────────────────────────────────────────────────────

  const heading =
    activeTab === "login"
      ? "Welcome back"
      : signupStep === "role"
        ? "Join SwasthAI"
        : signupStep === "credentials"
          ? "Create your account"
          : "Complete your profile";

  const subheading =
    activeTab === "login"
      ? "Access your personalized health dashboard."
      : signupStep === "role"
        ? "Choose your account type."
        : signupStep === "credentials"
          ? "Create your secure account."
          : "Almost done — fill in your patient details.";

  // ─── Role badge ───────────────────────────────────────────────────────────

  const RoleBadge = ({ onBack }: { onBack: () => void }) => (
    <div className="flex items-center gap-2 -mt-1 mb-1">
      <button
        type="button"
        onClick={onBack}        className="flex items-center gap-1 text-[0.78rem] text-[#64748B] hover:text-[#1E293B] bg-transparent border-none cursor-pointer font-sans transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      <div
        className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-semibold"
        style={{
          backgroundColor: `${accentColor}18`,
          color: accentColor,
        }}      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: accentColor }}        />
        Patient
      </div>
    </div>
  );

  // ─── UI ───────────────────────────────────────────────────────────────────

  return (
    <div className="w-full bg-[#F8FAFC] relative overflow-hidden text-[#1E293B]">
      {/* Logo */}      <div className="text-center mb-6 pt-1">
        <a href="/" className="inline-flex items-center gap-2.5 no-underline">
          <div className="w-[38px] h-[38px] rounded-full bg-[#4F7DF3] flex items-center justify-center shadow-[0_4px_12px_rgba(79,125,243,0.35)]">
            <Heart className="w-5 h-5 text-white" fill="white" />
          </div>

          <span className="text-2xl font-bold text-[#1E293B] tracking-tight">
            SwasthAI
          </span>
        </a>

        <h2 className="mt-4 font-sans text-[1.3rem] font-semibold text-[#1E293B]">
          {heading}        </h2>

        <p className="text-[0.82rem] text-[#64748B] font-sans mt-1">
          {subheading}        </p>
      </div>

      {/* Tabs */}      <div className="flex mb-6 bg-[#F8FAFC] rounded-full p-1 border border-[rgba(0,0,0,0.06)]">
        {(["login", "signup"] as const).map((tab) => (
          <button
            key={tab}            type="button"
            onClick={() => switchTab(tab)}            className={`flex-1 py-2.5 rounded-full border-none cursor-pointer font-sans font-semibold text-[0.9rem] transition-all duration-200 ${
              activeTab === tab
                ? "bg-[#4F7DF3] text-white shadow-[0_2px_8px_rgba(79,125,243,0.35)]"
                : "bg-transparent text-[#64748B] hover:text-[#1E293B]"
            }`}          >
            {tab === "login" ? "Log In" : "Sign Up"}          </button>
        ))}      </div>

      {/* Feedback */}      {success && (
        <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-[10px] text-[0.85rem] text-emerald-800 font-sans">
          ✓ {success}        </div>
      )}      {error && (
        <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-[10px] text-[0.85rem] text-rose-700 font-sans">
          {error}        </div>
      )}      {/* LOGIN FORM */}      {activeTab === "login" && (
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Field
            label="Email Address"
            type="email"
            value={loginData.email}            onChange={(v) => setLoginData({ ...loginData, email: v })}            placeholder="you@example.com"
            required
          />

          <Field
            label="Password"
            type="password"
            value={loginData.password}            onChange={(v) => setLoginData({ ...loginData, password: v })}            placeholder="••••••••"
            required
            showPassword={showLoginPassword}            onTogglePassword={() =>
              setShowLoginPassword((prev) => !prev)
            }          />

          <button
            type="submit"
            disabled={loading}            className="mt-2 w-full py-3 bg-[#4F7DF3] hover:bg-[#3D6DE3] disabled:opacity-60 disabled:cursor-not-allowed text-white border-none rounded-full text-[0.95rem] font-bold font-sans cursor-pointer shadow-[0_4px_12px_rgba(79,125,243,0.35)] transition-all duration-200 hover:-translate-y-px"
          >
            {loading ? "Logging in…" : "Log In"}          </button>
        </form>
      )}      {/* SIGNUP STEP 1: ROLE */}      {activeTab === "signup" && signupStep === "role" && (
        <div className="flex flex-col gap-3">
          {ROLES.map((role) => (
            <button
              key={role.id}              type="button"
              onClick={() => {
                if (role.id !== "patient") {
                  setError(
                    "Doctor and pharmacy accounts require administrator approval. Please register as a patient."
                  );
                  return;
                }                setSelectedRole("patient");
                setSignupStep("credentials");
                setError("");
              }}              className="w-full flex items-center gap-4 px-4 py-4 bg-white border-[1.5px] border-[rgba(0,0,0,0.08)] rounded-[12px] cursor-pointer text-left transition-all duration-200 hover:border-[#4F7DF3] hover:shadow-[0_2px_12px_rgba(79,125,243,0.12)] group"
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors"
                style={{
                  backgroundColor: `${role.color}15`,
                  color: role.color,
                }}              >
                {role.icon}              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[0.95rem] text-[#1E293B]">
                  {role.label}                </div>

                <div className="text-[0.78rem] text-[#64748B] mt-0.5">
                  {role.subtitle}                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#4F7DF3] shrink-0" />
            </button>
          ))}        </div>
      )}      {/* SIGNUP STEP 2: CREDENTIALS */}      {activeTab === "signup" && signupStep === "credentials" && (
        <form
          onSubmit={handleCredentialsNext}          className="flex flex-col gap-4"
        >
          <RoleBadge onBack={() => setSignupStep("role")} />

          <Field
            label="Full Name"
            type="text"
            value={creds.name}            onChange={(v) => setCreds({ ...creds, name: v })}            placeholder="Jane Doe"
            required
          />

          <Field
            label="Email Address"
            type="email"
            value={creds.email}            onChange={(v) => setCreds({ ...creds, email: v })}            placeholder="you@example.com"
            required
          />

          <Field
            label="Password"
            type="password"
            value={creds.password}            onChange={(v) => setCreds({ ...creds, password: v })}            placeholder="Minimum 8 characters"
            required
            showPassword={showSignupPassword}            onTogglePassword={() =>
              setShowSignupPassword((prev) => !prev)
            }          />

          <button
            type="submit"
            className="mt-2 w-full py-3 text-white border-none rounded-full text-[0.95rem] font-bold font-sans cursor-pointer shadow-md transition-all duration-200 hover:-translate-y-px"
            style={{ backgroundColor: accentColor }}          >
            Continue →
          </button>
        </form>
      )}      {/* SIGNUP STEP 3: PATIENT PROFILE */}      {activeTab === "signup" && signupStep === "profile" && (
        <form
          onSubmit={handleProfileSubmit}          className="flex flex-col gap-4"
        >
          <RoleBadge onBack={() => setSignupStep("credentials")} />

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Age"
              type="number"
              value={patientP.age}              onChange={(v) => setPatientP({ ...patientP, age: v })}              placeholder="25"
            />

            <SelectField
              label="Gender"
              value={patientP.gender}              onChange={(v) => setPatientP({ ...patientP, gender: v })}              options={["Male", "Female", "Other"]}            />
          </div>

          <Field
            label="Phone Number"
            type="tel"
            value={patientP.phone}            onChange={(v) => setPatientP({ ...patientP, phone: v })}            placeholder="+91 9876543210"
          />

          <SelectField
            label="Blood Group"
            value={patientP.blood_group}            onChange={(v) => setPatientP({ ...patientP, blood_group: v })}            options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}          />

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Height (cm)"
              type="number"
              value={patientP.height}              onChange={(v) => setPatientP({ ...patientP, height: v })}              placeholder="170"
            />

            <Field
              label="Weight (kg)"
              type="number"
              value={patientP.weight}              onChange={(v) => setPatientP({ ...patientP, weight: v })}              placeholder="65"
            />
          </div>

          <button
            type="submit"
            disabled={loading}            className="mt-1 w-full py-3 text-white border-none rounded-full text-[0.95rem] font-bold font-sans cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-px"
            style={{ backgroundColor: accentColor }}          >
            {loading ? "Creating account…" : "Complete Sign Up"}          </button>
        </form>
      )}      {/* Footer */}      <p className="text-center text-xs text-[#64748B] mt-5 font-sans">
        By continuing, you agree to our{" "}        <a
          href="#"
          className="text-[#4F7DF3] no-underline hover:underline"
        >
          Terms
        </a>{" "}        and{" "}        <a
          href="#"
          className="text-[#4F7DF3] no-underline hover:underline"
        >
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}