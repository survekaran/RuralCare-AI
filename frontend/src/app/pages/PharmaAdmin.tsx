import { useEffect, useState } from "react";
import {
  Plus, Search, Edit2, Trash2, X, Check, Package,
  AlertTriangle, TrendingUp, ChevronDown, Filter, Download,
  Pill, Stethoscope, FlaskConical, HeartPulse, ShieldPlus,
  RefreshCw, ArrowUpDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

type Category = "Diabetes" | "Cholesterol" | "Blood Pressure" | "Antibiotic" | "Pain Relief" | "Supplement" | "Cardiac" | "Thyroid" | "Antacid" | "Other";
type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

interface Medicine {
  id: number;
  name: string;
  brand: string;
  category: Category;
  dose: string;
  form: string;
  price: number;
  stock: number;
  min_stock: number;
  manufacturer: string;
  expiry: string;
  prescription_required: boolean;
}

interface PharmacyProfile {
  id?: number;
  user_id?: number;
  pharmacist_name: string;
  store_name: string;
  degree: string;
  license_number: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  opening_hours: string;
  verified: boolean;
}

const CATEGORIES: Category[] = [
  "Diabetes", "Cholesterol", "Blood Pressure", "Antibiotic",
  "Pain Relief", "Supplement", "Cardiac", "Thyroid", "Antacid", "Other",
];

const FORMS = ["Tablet", "Capsule", "Syrup", "Injection", "Drops", "Cream", "Gel", "Lotion", "Ointment", "Suspension", "Solution", "Inhaler", "Powder", "Soap", "Granules", "Other"];

const categoryIcons: Record<Category, React.ReactNode> = {
  Diabetes: <Stethoscope className="w-3.5 h-3.5" />,
  Cholesterol: <HeartPulse className="w-3.5 h-3.5" />,
  "Blood Pressure": <TrendingUp className="w-3.5 h-3.5" />,
  Antibiotic: <ShieldPlus className="w-3.5 h-3.5" />,
  "Pain Relief": <Pill className="w-3.5 h-3.5" />,
  Supplement: <FlaskConical className="w-3.5 h-3.5" />,
  Cardiac: <HeartPulse className="w-3.5 h-3.5" />,
  Thyroid: <FlaskConical className="w-3.5 h-3.5" />,
  Antacid: <Pill className="w-3.5 h-3.5" />,
  Other: <Package className="w-3.5 h-3.5" />,
};

const categoryColors: Record<Category, string> = {
  Diabetes: "bg-blue-50 text-blue-700",
  Cholesterol: "bg-rose-50 text-rose-700",
  "Blood Pressure": "bg-purple-50 text-purple-700",
  Antibiotic: "bg-amber-50 text-amber-700",
  "Pain Relief": "bg-orange-50 text-orange-700",
  Supplement: "bg-emerald-50 text-emerald-700",
  Cardiac: "bg-pink-50 text-pink-700",
  Thyroid: "bg-teal-50 text-teal-700",
  Antacid: "bg-cyan-50 text-cyan-700",
  Other: "bg-slate-50 text-slate-600",
};

const emptyForm = (): Omit<Medicine, "id"> => ({
  name: "", brand: "", category: "Other", dose: "", form: "Tablet",
  price: 0, stock: 0, min_stock: 20, manufacturer: "", expiry: "", prescription_required: false,
});

function getStockStatus(stock: number, min: number): StockStatus {
  if (stock === 0) return "Out of Stock";
  if (stock <= min) return "Low Stock";
  return "In Stock";
}

const stockStatusStyles: Record<StockStatus, string> = {
  "In Stock": "bg-emerald-50 text-emerald-700",
  "Low Stock": "bg-amber-50 text-amber-700",
  "Out of Stock": "bg-rose-50 text-rose-700",
};

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[rgba(79,125,243,0.08)] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(79,125,243,0.06)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8]">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-[#1E293B]">{value}</div>
      <div className="text-xs text-[#94A3B8] mt-1">{sub}</div>
    </div>
  );
}

function emptyPharmacyProfile(userId?: number, name = "", email = ""): PharmacyProfile {
  return {
    user_id: userId,
    pharmacist_name: name,
    store_name: "",
    degree: "",
    license_number: "",
    phone: "",
    email,
    address: "",
    city: "",
    state: "",
    pincode: "",
    opening_hours: "",
    verified: false,
  };
}

interface PharmacyProfileModalProps {
  initial: PharmacyProfile;
  onSave: (profile: PharmacyProfile) => void;
  onClose: () => void;
}

function PharmacyProfileModal({ initial, onSave, onClose }: PharmacyProfileModalProps) {
  const [form, setForm] = useState(initial);
  const set = (key: keyof PharmacyProfile, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));
  const fieldClass = "w-full px-3.5 py-2.5 border border-[rgba(0,0,0,0.1)] rounded-xl text-sm text-[#1E293B] bg-white outline-none transition focus:border-[#4F7DF3] focus:ring-2 focus:ring-[#4F7DF3]/20 placeholder:text-[#94A3B8]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-[rgba(0,0,0,0.06)] rounded-t-3xl z-10 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">Pharmacist Profile</div>
            <h2 className="text-xl font-bold text-[#1E293B]">Edit Store Details</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F8FAFC] text-[#64748B] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Pharmacist Name *</label>
              <input required value={form.pharmacist_name} onChange={(e) => set("pharmacist_name", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Store Name *</label>
              <input required value={form.store_name} onChange={(e) => set("store_name", e.target.value)} className={fieldClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Phone</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Email</label>
              <input value={form.email} onChange={(e) => set("email", e.target.value)} className={fieldClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Degree</label>
              <input value={form.degree} onChange={(e) => set("degree", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">License Number</label>
              <input value={form.license_number} onChange={(e) => set("license_number", e.target.value)} className={fieldClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Address</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} className={fieldClass} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">City</label>
              <input value={form.city} onChange={(e) => set("city", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">State</label>
              <input value={form.state} onChange={(e) => set("state", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Pincode</label>
              <input value={form.pincode} onChange={(e) => set("pincode", e.target.value)} className={fieldClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Opening Hours</label>
            <input value={form.opening_hours} onChange={(e) => set("opening_hours", e.target.value)} className={fieldClass} placeholder="8 AM - 10 PM" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full border border-[rgba(0,0,0,0.1)] text-[#64748B] hover:bg-[#F8FAFC] transition-colors text-sm font-semibold">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-full bg-[#4F7DF3] hover:bg-[#3D6DE3] text-white text-sm font-bold transition-colors shadow-[0_2px_10px_rgba(79,125,243,0.3)]">
              Save Store Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddStockModalProps {
  onSave: (payload: { mode: "existing"; medicine: Medicine; quantity: number } | { mode: "new"; medicine: Omit<Medicine, "id">; quantity: number }) => void;
  onClose: () => void;
}

function AddStockModal({ onSave, onClose }: AddStockModalProps) {
  const [query, setQuery] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [createNew, setCreateNew] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [suggestions, setSuggestions] = useState<Medicine[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionCategory, setSuggestionCategory] = useState<"All" | Category>("All");
  const [suggestionStatus, setSuggestionStatus] = useState<"All" | StockStatus>("All");
  const set = (k: keyof typeof form, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let cancelled = false;

    const loadSuggestions = async () => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      setSuggestionsLoading(true);
      try {
        const params = new URLSearchParams({ q: query.trim(), limit: "8" });
        if (suggestionCategory !== "All") params.set("category", suggestionCategory);
        if (suggestionStatus !== "All") params.set("status", suggestionStatus);
        const response = await fetch(`/medicines/?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to search medicines");
        const data: Medicine[] = await response.json();
        if (!cancelled) setSuggestions(data);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    };

    const timeout = window.setTimeout(loadSuggestions, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query, suggestionCategory, suggestionStatus]);

  const selectedMedicine = selectedId === null ? null : suggestions.find((medicine) => medicine.id === selectedId) ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;
    if (createNew) {
      onSave({ mode: "new", medicine: { ...form, stock: quantity }, quantity });
      return;
    }
    if (!selectedMedicine) return;
    onSave({ mode: "existing", medicine: selectedMedicine, quantity });
  };

  const fieldClass = "w-full px-3.5 py-2.5 border border-[rgba(0,0,0,0.1)] rounded-xl text-sm text-[#1E293B] bg-white outline-none transition focus:border-[#4F7DF3] focus:ring-2 focus:ring-[#4F7DF3]/20 placeholder:text-[#94A3B8]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-[rgba(0,0,0,0.06)] rounded-t-3xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">Pharma Admin</div>
              <h2 className="text-xl font-bold text-[#1E293B]">
                Add Medicine Stock
              </h2>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F8FAFC] text-[#64748B] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Search Existing Medicine</label>
            <input
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setCreateNew(false);
                setSelectedId(null);
              }}
              placeholder="Type medicine name or brand..."
              className={fieldClass}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Filter by Category</label>
                <select value={suggestionCategory} onChange={e => setSuggestionCategory(e.target.value as "All" | Category)} className={fieldClass}>
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Likely in DB</label>
                <select value={suggestionStatus} onChange={e => setSuggestionStatus(e.target.value as "All" | StockStatus)} className={fieldClass}>
                  <option value="All">All Results</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>
            {!createNew && query && suggestionsLoading && (
              <div className="mt-2 px-4 py-3 rounded-2xl bg-[#F8FAFC] border border-[rgba(0,0,0,0.08)] text-sm text-[#64748B]">
                Searching medicines in database...
              </div>
            )}
            {!createNew && query && suggestions.length > 0 && (
              <div className="mt-2 border border-[rgba(0,0,0,0.08)] rounded-2xl overflow-hidden bg-white">
                {suggestions.map((medicine) => (
                  <button
                    key={medicine.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(medicine.id);
                      setQuery(medicine.name);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-[#F8FAFC] border-b border-[rgba(0,0,0,0.04)] last:border-b-0"
                  >
                    <div className="font-semibold text-sm text-[#1E293B]">{medicine.name}</div>
                    <div className="text-xs text-[#94A3B8]">{medicine.brand} · {medicine.category} · current stock {medicine.stock}</div>
                  </button>
                ))}
              </div>
            )}
            {!createNew && query && !suggestionsLoading && suggestions.length === 0 && (
              <div className="mt-2 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="text-sm text-amber-800 mb-2">No matching medicine found in the catalog.</div>
                <button
                  type="button"
                  onClick={() => {
                    setCreateNew(true);
                    setForm((prev) => ({ ...prev, name: query || prev.name, brand: query || prev.brand }));
                  }}
                  className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold"
                >
                  Create New Medicine
                </button>
              </div>
            )}
          </div>

          {selectedMedicine && !createNew && (
            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[rgba(0,0,0,0.06)]">
              <div className="text-sm font-semibold text-[#1E293B]">Selected: {selectedMedicine.name}</div>
              <div className="text-xs text-[#64748B] mt-1">{selectedMedicine.brand} · {selectedMedicine.dose || "No dose"} · {selectedMedicine.form}</div>
              <div className="text-xs text-[#64748B] mt-1">Current stock: {selectedMedicine.stock}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Quantity to Add *</label>
              <input required type="number" min={1} value={quantity || ""} onChange={e => setQuantity(Number(e.target.value))} placeholder="0" className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Min Stock Alert</label>
              <input type="number" min={0} value={form.min_stock || ""} onChange={e => set("min_stock", Number(e.target.value))} placeholder="20" className={fieldClass} disabled={!createNew} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Price (₹)</label>
              <input type="number" min={0} value={form.price || ""} onChange={e => set("price", Number(e.target.value))} placeholder="0.00" className={fieldClass} disabled={!createNew} />
            </div>
          </div>

          {createNew && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Medicine Name *</label>
                  <input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Metformin" className={fieldClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Brand Name *</label>
                  <input required value={form.brand} onChange={e => set("brand", e.target.value)} placeholder="e.g. Glyciphage" className={fieldClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Category *</label>
                  <select required value={form.category} onChange={e => set("category", e.target.value as Category)} className={fieldClass}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Dosage</label>
                  <input value={form.dose} onChange={e => set("dose", e.target.value)} placeholder="e.g. 500mg" className={fieldClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Form *</label>
                  <select required value={form.form} onChange={e => set("form", e.target.value)} className={fieldClass}>
                    {FORMS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Manufacturer</label>
                  <input value={form.manufacturer} onChange={e => set("manufacturer", e.target.value)} placeholder="e.g. Sun Pharma" className={fieldClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Expiry Date</label>
                  <input type="month" value={form.expiry} onChange={e => set("expiry", e.target.value)} className={fieldClass} />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl border border-[rgba(0,0,0,0.06)]">
                <button
                  type="button"
                  onClick={() => set("prescription_required", !form.prescription_required)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.prescription_required ? "bg-[#4F7DF3]" : "bg-[#CBD5E1]"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.prescription_required ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                <div>
                  <div className="text-sm font-semibold text-[#1E293B]">Prescription Required</div>
                  <div className="text-xs text-[#94A3B8]">Enable this if a prescription is needed.</div>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full border border-[rgba(0,0,0,0.1)] text-[#64748B] hover:bg-[#F8FAFC] transition-colors text-sm font-semibold">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-full bg-[#4F7DF3] hover:bg-[#3D6DE3] text-white text-sm font-bold transition-colors shadow-[0_2px_10px_rgba(79,125,243,0.3)]">
              {createNew ? "Create Medicine & Add Stock" : "Add Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditModalProps {
  initial: Medicine;
  onSave: (data: Medicine) => void;
  onClose: () => void;
}

function EditModal({ initial, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof Medicine, v: unknown) => setForm((p) => ({ ...p, [k]: v }));
  const fieldClass = "w-full px-3.5 py-2.5 border border-[rgba(0,0,0,0.1)] rounded-xl text-sm text-[#1E293B] bg-white outline-none transition focus:border-[#4F7DF3] focus:ring-2 focus:ring-[#4F7DF3]/20 placeholder:text-[#94A3B8]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-[rgba(0,0,0,0.06)] rounded-t-3xl z-10 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">Pharma Admin</div>
            <h2 className="text-xl font-bold text-[#1E293B]">Edit Medicine</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F8FAFC] text-[#64748B] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Medicine Name *</label>
              <input required value={form.name} onChange={e => set("name", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Brand Name *</label>
              <input required value={form.brand} onChange={e => set("brand", e.target.value)} className={fieldClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Category *</label>
              <select required value={form.category} onChange={e => set("category", e.target.value as Category)} className={fieldClass}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Dosage</label>
              <input value={form.dose} onChange={e => set("dose", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Form *</label>
              <select required value={form.form} onChange={e => set("form", e.target.value)} className={fieldClass}>
                {FORMS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Price (₹) *</label>
              <input required type="number" min={0} value={form.price || ""} onChange={e => set("price", Number(e.target.value))} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Current Stock *</label>
              <input required type="number" min={0} value={form.stock || ""} onChange={e => set("stock", Number(e.target.value))} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Min Stock Alert</label>
              <input type="number" min={0} value={form.min_stock || ""} onChange={e => set("min_stock", Number(e.target.value))} className={fieldClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Manufacturer</label>
              <input value={form.manufacturer} onChange={e => set("manufacturer", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Expiry Date</label>
              <input type="month" value={form.expiry} onChange={e => set("expiry", e.target.value)} className={fieldClass} />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl border border-[rgba(0,0,0,0.06)]">
            <button
              type="button"
              onClick={() => set("prescription_required", !form.prescription_required)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.prescription_required ? "bg-[#4F7DF3]" : "bg-[#CBD5E1]"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.prescription_required ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <div>
              <div className="text-sm font-semibold text-[#1E293B]">Prescription Required</div>
              <div className="text-xs text-[#94A3B8]">Toggle if this medicine requires a prescription.</div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full border border-[rgba(0,0,0,0.1)] text-[#64748B] hover:bg-[#F8FAFC] transition-colors text-sm font-semibold">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-full bg-[#4F7DF3] hover:bg-[#3D6DE3] text-white text-sm font-bold transition-colors shadow-[0_2px_10px_rgba(79,125,243,0.3)]">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PharmaAdmin() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [pharmacyProfile, setPharmacyProfile] = useState<PharmacyProfile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<"All" | Category>("All");
  const [filterStatus, setFilterStatus] = useState<"All" | StockStatus>("All");
  const [sortField, setSortField] = useState<keyof Medicine>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPharmacyProfile = async () => {
    if (!user.userId) {
      setPharmacyProfile(emptyPharmacyProfile(undefined, user.name, user.email));
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    try {
      const response = await fetch(`/pharmacies/?user_id=${user.userId}`);
      if (!response.ok) throw new Error("Failed to load pharmacy profile");
      const data: PharmacyProfile[] = await response.json();
      const profile = data[0] ?? emptyPharmacyProfile(user.userId, user.name, user.email);
      setPharmacyProfile(profile);
    } catch {
      setPharmacyProfile(emptyPharmacyProfile(user.userId, user.name, user.email));
    } finally {
      setProfileLoading(false);
    }
  };

  const loadMedicines = async (options?: { search?: string; category?: "All" | Category; status?: "All" | StockStatus }) => {
    if (!pharmacyProfile?.id) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/pharmacies/${pharmacyProfile.id}/inventory`);
      if (!response.ok) throw new Error(`Failed to load inventory (${response.status})`);
      const data = await response.json();
      
      const mappedMedicines = data.map((inv: any) => ({
        ...inv.medicine,
        stock: inv.quantity_available
      }));

      setMedicines(mappedMedicines);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!pharmacyProfile?.id) return;
    const timeout = window.setTimeout(() => {
      loadMedicines();
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [search, filterCategory, filterStatus, pharmacyProfile?.id]);

  useEffect(() => {
    loadPharmacyProfile();
  }, [user.userId, user.name, user.email]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddStock = async (payload: { mode: "existing"; medicine: Medicine; quantity: number } | { mode: "new"; medicine: Omit<Medicine, "id">; quantity: number }) => {
    if (!pharmacyProfile?.id) {
      showToast("Store profile must be created first", "error");
      return;
    }
    
    try {
      let medId: number;
      if (payload.mode === "existing") {
        medId = payload.medicine.id;
      } else {
        const response = await fetch("/medicines/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload.medicine, stock: 0 }), // global stock not used
        });
        if (!response.ok) throw new Error("Failed to create medicine");
        const created = await response.json();
        medId = created.id;
      }

      const invResponse = await fetch(`/pharmacies/${pharmacyProfile.id}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicine_id: medId, quantity_added: payload.quantity }),
      });
      if (!invResponse.ok) throw new Error("Failed to update inventory");
      
      showToast(payload.mode === "new" ? "Medicine created and stock added." : "Stock added successfully.");
      setAddOpen(false);
      loadMedicines(); // Reload inventory to reflect new data
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to add stock", "error");
    }
  };

  const handleSaveEdit = async (medicine: Medicine) => {
    if (!pharmacyProfile?.id) return;
    try {
      const response = await fetch(`/medicines/${medicine.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Don't modify global stock!
        body: JSON.stringify({...medicine, stock: 0}), 
      });
      if (!response.ok) throw new Error("Failed to update medicine details");
      
      const invResponse = await fetch(`/pharmacies/${pharmacyProfile.id}/inventory/${medicine.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity_available: medicine.stock }),
      });
      if (!invResponse.ok) throw new Error("Failed to update inventory quantity");

      showToast("Medicine updated successfully.");
      setEditingMedicine(null);
      loadMedicines(); // Reload to reflect changes
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update medicine", "error");
    }
  };

  const handleSavePharmacyProfile = async (profile: PharmacyProfile) => {
    try {
      const isExisting = Boolean(profile.id);
      const response = await fetch(isExisting ? `/pharmacies/${profile.id}` : "/pharmacies/", {
        method: isExisting ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          user_id: profile.user_id ?? user.userId,
          pharmacist_name: profile.pharmacist_name || user.name,
          email: profile.email || user.email,
        }),
      });
      if (!response.ok) throw new Error("Failed to save pharmacy profile");
      const saved = await response.json();
      setPharmacyProfile(saved);
      setProfileOpen(false);
      showToast("Store profile updated successfully.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save store profile", "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!pharmacyProfile?.id) return;
    try {
      const response = await fetch(`/pharmacies/${pharmacyProfile.id}/inventory/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete medicine");
      setMedicines(p => p.filter(m => m.id !== id));
      setDeleteConfirm(null);
      showToast("Medicine removed.", "error");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete medicine", "error");
    }
  };

  const toggleSort = (field: keyof Medicine) => {
    if (sortField === field) setSortAsc(p => !p);
    else { setSortField(field); setSortAsc(true); }
  };

  const filtered = medicines
    .filter(m => {
      const q = search.toLowerCase();
      const matchSearch = !q || m.name.toLowerCase().includes(q) || m.brand.toLowerCase().includes(q) || m.manufacturer.toLowerCase().includes(q);
      const matchCat = filterCategory === "All" || m.category === filterCategory;
      const matchStatus = filterStatus === "All" || getStockStatus(m.stock, m.min_stock) === filterStatus;
      return matchSearch && matchCat && matchStatus;
    })
    .sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === "number" && typeof bv === "number") return sortAsc ? av - bv : bv - av;
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

  const totalMeds = medicines.length;
  const inStock = medicines.filter(m => getStockStatus(m.stock, m.min_stock) === "In Stock").length;
  const lowStock = medicines.filter(m => getStockStatus(m.stock, m.min_stock) === "Low Stock").length;
  const outOfStock = medicines.filter(m => getStockStatus(m.stock, m.min_stock) === "Out of Stock").length;
  const prescriptionOnly = medicines.filter(m => m.prescription_required).length;

  const SortIcon = ({ field }: { field: keyof Medicine }) => (
    <ArrowUpDown className={`w-3.5 h-3.5 ml-1 inline transition-colors ${sortField === field ? "text-[#4F7DF3]" : "text-[#CBD5E1]"}`} />
  );

  if (user.role !== "pharmacy") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-[rgba(79,125,243,0.08)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B] mb-2">Pharmacist Access Only</h1>
          <p className="text-sm text-[#64748B]">This inventory and stock-adding workflow is only available for pharmacy accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-semibold transition-all ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
          {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-[#1E293B] mb-1">Remove Medicine?</h3>
            <p className="text-sm text-[#64748B] mb-5">This will permanently remove the medicine from your inventory.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-full border border-[rgba(0,0,0,0.1)] text-[#64748B] hover:bg-[#F8FAFC] transition-colors text-sm font-semibold">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {addOpen && (
        <AddStockModal
          onSave={handleAddStock}
          onClose={() => setAddOpen(false)}
        />
      )}

      {editingMedicine && (
        <EditModal
          initial={editingMedicine}
          onSave={handleSaveEdit}
          onClose={() => setEditingMedicine(null)}
        />
      )}

      {profileOpen && pharmacyProfile && (
        <PharmacyProfileModal
          initial={pharmacyProfile}
          onSave={handleSavePharmacyProfile}
          onClose={() => setProfileOpen(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">SwasthAI · Admin Panel</div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Pharmacy Inventory</h1>
            <p className="text-sm text-[#64748B] mt-0.5">Manage medicines, stock levels and pricing</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[rgba(0,0,0,0.1)] text-[#64748B] hover:bg-white text-sm font-medium transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => loadMedicines()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[rgba(0,0,0,0.1)] text-[#64748B] hover:bg-white text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4F7DF3] hover:bg-[#3D6DE3] text-white text-sm font-bold transition-colors shadow-[0_2px_10px_rgba(79,125,243,0.35)]"
            >
              <Plus className="w-4 h-4" />
              Add Stock
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[rgba(79,125,243,0.08)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">Store Profile</div>
              <h2 className="text-xl font-bold text-[#1E293B]">
                {profileLoading ? "Loading store..." : (pharmacyProfile?.store_name || "Set your store name")}
              </h2>
              <p className="text-sm text-[#64748B] mt-1">
                {pharmacyProfile?.address
                  ? [pharmacyProfile.address, pharmacyProfile.city, pharmacyProfile.state].filter(Boolean).join(", ")
                  : "Add your pharmacy details so you can keep your storefront information up to date."}
              </p>
              {pharmacyProfile?.phone && (
                <p className="text-xs text-[#94A3B8] mt-2">Phone: {pharmacyProfile.phone}</p>
              )}
            </div>
            <button
              onClick={() => pharmacyProfile && setProfileOpen(true)}
              disabled={profileLoading || !pharmacyProfile}
              className="px-5 py-2.5 rounded-full bg-white border border-[#4F7DF3] text-[#4F7DF3] hover:bg-[#EEF2FF] disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
            >
              Edit Store Profile
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Medicines" value={totalMeds} sub="across all categories" color="bg-blue-50 text-[#4F7DF3]" icon={<Package className="w-4 h-4" />} />
          <StatCard label="In Stock" value={inStock} sub="fully stocked" color="bg-emerald-50 text-emerald-600" icon={<Check className="w-4 h-4" />} />
          <StatCard label="Low Stock" value={lowStock} sub="need restocking" color="bg-amber-50 text-amber-600" icon={<AlertTriangle className="w-4 h-4" />} />
          <StatCard label="Out of Stock" value={outOfStock} sub="unavailable" color="bg-rose-50 text-rose-600" icon={<RefreshCw className="w-4 h-4" />} />
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-[rgba(79,125,243,0.08)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, brand or manufacturer…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[rgba(0,0,0,0.08)] text-sm text-[#1E293B] bg-[#F8FAFC] outline-none focus:border-[#4F7DF3] focus:ring-2 focus:ring-[#4F7DF3]/20 placeholder:text-[#94A3B8]"
              />
            </div>

            {/* Category filter */}
            <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value as "All" | Category)}
                className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-[rgba(0,0,0,0.08)] text-sm text-[#1E293B] bg-[#F8FAFC] outline-none focus:border-[#4F7DF3] appearance-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
            </div>

            {/* Status filter */}
            <div className="relative w-full sm:w-auto">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as "All" | StockStatus)}
                className="w-full pl-4 pr-8 py-2.5 rounded-xl border border-[rgba(0,0,0,0.08)] text-sm text-[#1E293B] bg-[#F8FAFC] outline-none focus:border-[#4F7DF3] appearance-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-xs text-[#94A3B8]">
            Showing <span className="font-semibold text-[#1E293B]">{filtered.length}</span> of <span className="font-semibold text-[#1E293B]">{medicines.length}</span> medicines
            {prescriptionOnly > 0 && <span className="ml-3">· <span className="font-semibold text-[#4F7DF3]">{prescriptionOnly}</span> require prescription</span>}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[rgba(79,125,243,0.08)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">

          {/* Mobile card list — visible only on xs */}
          <div className="sm:hidden">
            {loading ? (
              <div className="py-12 text-center text-[#94A3B8] text-sm">Loading medicines...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-[#94A3B8] text-sm">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                No medicines found.
              </div>
            ) : filtered.map((m) => {
              const status = getStockStatus(m.stock, m.min_stock);
              const stockBarColor = status === "In Stock" ? "#22c55e" : status === "Low Stock" ? "#f59e0b" : "#f43f5e";
              return (
                <div key={m.id} className="p-4 border-b border-[rgba(0,0,0,0.04)] last:border-0 hover:bg-[#F8FAFC]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1E293B] text-sm truncate">{m.name}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{m.brand} · {m.manufacturer}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditingMedicine(m)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#EEF2FF] text-[#4F7DF3] transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteConfirm(m.id)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-rose-50 text-rose-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${categoryColors[m.category]}`}>{categoryIcons[m.category]}{m.category}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stockStatusStyles[status]}`}>{status}</span>
                    {m.prescription_required && <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 text-[10px] font-semibold">Rx</span>}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                    <div className="bg-[#F8FAFC] rounded-lg p-2">
                      <p className="text-[#94A3B8] text-[10px]">Dose</p>
                      <p className="font-semibold text-[#1E293B] mt-0.5 truncate">{m.dose}</p>
                    </div>
                    <div className="bg-[#F8FAFC] rounded-lg p-2">
                      <p className="text-[#94A3B8] text-[10px]">Price</p>
                      <p className="font-semibold text-[#1E293B] mt-0.5">₹{m.price}</p>
                    </div>
                    <div className="bg-[#F8FAFC] rounded-lg p-2">
                      <p className="text-[#94A3B8] text-[10px]">Stock</p>
                      <p className="font-semibold mt-0.5" style={{ color: stockBarColor }}>{m.stock}</p>
                    </div>
                    <div className="bg-[#F8FAFC] rounded-lg p-2">
                      <p className="text-[#94A3B8] text-[10px]">Expiry</p>
                      <p className="font-semibold text-[#1E293B] mt-0.5">{m.expiry || "—"}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table — hidden on xs */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.06)] bg-[#F8FAFC]">
                  {[
                    { label: "Medicine", field: "name" as keyof Medicine },
                    { label: "Category", field: "category" as keyof Medicine },
                    { label: "Dose / Form", field: "dose" as keyof Medicine },
                    { label: "Price", field: "price" as keyof Medicine },
                    { label: "Stock", field: "stock" as keyof Medicine },
                    { label: "Expiry", field: "expiry" as keyof Medicine },
                    { label: "Status", field: null },
                    { label: "Actions", field: null },
                  ].map(({ label, field }) => (
                    <th
                      key={label}
                      onClick={field ? () => toggleSort(field) : undefined}
                      className={`text-left px-5 py-3.5 text-xs font-semibold tracking-wider uppercase text-[#64748B] whitespace-nowrap ${field ? "cursor-pointer select-none hover:text-[#1E293B]" : ""}`}
                    >
                      {label}
                      {field && <SortIcon field={field} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(0,0,0,0.04)]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[#94A3B8] text-sm">
                      Loading medicines...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[#94A3B8] text-sm">
                      <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      No medicines found matching your filters.
                    </td>
                  </tr>
                ) : filtered.map((m) => {
                  const status = getStockStatus(m.stock, m.min_stock);
                  const stockPct = Math.min((m.stock / Math.max(m.stock + m.min_stock, 1)) * 100, 100);
                  const stockBarColor = status === "In Stock" ? "#22c55e" : status === "Low Stock" ? "#f59e0b" : "#f43f5e";
                  return (
                    <tr key={m.id} className="hover:bg-[#F8FAFC] transition-colors group">
                      {/* Medicine Name */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#1E293B]">{m.name}</div>
                        <div className="text-xs text-[#94A3B8] mt-0.5">{m.brand} · {m.manufacturer}</div>
                        {m.prescription_required && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 text-[10px] font-semibold">
                            Rx
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${categoryColors[m.category]}`}>
                          {categoryIcons[m.category]}
                          {m.category}
                        </span>
                      </td>

                      {/* Dose / Form */}
                      <td className="px-5 py-4 text-[#1E293B]">
                        <span className="font-medium">{m.dose}</span>
                        <span className="text-[#94A3B8] ml-1">· {m.form}</span>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4 font-semibold text-[#1E293B]">
                        ₹{m.price}
                      </td>

                      {/* Stock */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${stockPct}%`, background: stockBarColor }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: stockBarColor }}>{m.stock}</span>
                        </div>
                        <div className="text-[10px] text-[#94A3B8] mt-0.5">min: {m.min_stock}</div>
                      </td>

                      {/* Expiry */}
                      <td className="px-5 py-4 text-[#64748B] text-xs whitespace-nowrap">
                        {m.expiry || "—"}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stockStatusStyles[status]}`}>
                          {status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingMedicine(m)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#EEF2FF] text-[#4F7DF3] transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(m.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-rose-50 text-rose-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-[rgba(0,0,0,0.04)] bg-[#F8FAFC] flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">{filtered.length} records</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-xs text-[#64748B] mr-3">In Stock</span>
                <div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-xs text-[#64748B] mr-3">Low</span>
                <div className="w-2 h-2 rounded-full bg-rose-400" /><span className="text-xs text-[#64748B]">Out</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
