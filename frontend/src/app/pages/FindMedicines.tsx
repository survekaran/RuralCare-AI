import { useEffect, useState } from "react";
import { Search, MapPin, Phone, Clock, CheckCircle, Package, Loader2, AlertCircle } from "lucide-react";

interface MedicineSuggestion {
  id: number;
  name: string;
  category: string;
  brand: string;
  form: string;
  stock: number;
}

interface Pharmacy {
  id: number;
  pharmacist_name: string;
  store_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  opening_hours: string;
  verified: boolean;
}

interface PharmacyAvailability {
  pharmacy_id: number;
  store_name: string;
  pharmacist_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  opening_hours: string;
  verified: boolean;
  medicine_id: number;
  medicine_name: string;
  quantity_available: number;
}

export function FindMedicines() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineSuggestion | null>(null);
  const [medicineSuggestions, setMedicineSuggestions] = useState<MedicineSuggestion[]>([]);
  const [allPharmacies, setAllPharmacies] = useState<Pharmacy[]>([]);
  const [availabilityMap, setAvailabilityMap] = useState<Record<number, number>>({});
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [loadingPharmacies, setLoadingPharmacies] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPharmacies = async () => {
      setLoadingPharmacies(true);
      try {
        const response = await fetch("/pharmacies/?limit=500");
        if (!response.ok) throw new Error("Failed to load pharmacies");
        const data: Pharmacy[] = await response.json();
        if (!cancelled) setAllPharmacies(data);
      } catch {
        if (!cancelled) setAllPharmacies([]);
      } finally {
        if (!cancelled) setLoadingPharmacies(false);
      }
    };

    loadPharmacies();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAvailability = async () => {
      if (!selectedMedicine) {
        setAvailabilityMap({});
        return;
      }

      setLoadingAvailability(true);
      try {
        const response = await fetch(`/pharmacies/availability?medicine_id=${selectedMedicine.id}`);
        if (!response.ok) throw new Error("Failed to load pharmacy availability");
        const data: PharmacyAvailability[] = await response.json();
        if (!cancelled) {
          const map: Record<number, number> = {};
          data.forEach((item) => {
            map[item.pharmacy_id] = item.quantity_available;
          });
          setAvailabilityMap(map);
        }
      } catch {
        if (!cancelled) setAvailabilityMap({});
      } finally {
        if (!cancelled) setLoadingAvailability(false);
      }
    };

    loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [selectedMedicine]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setMedicineSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingMedicines(true);
      try {
        const res = await fetch(`/medicines/?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setMedicineSuggestions(data);
        } else {
          setMedicineSuggestions([]);
        }
      } catch (err) {
        console.error("Failed to search medicines:", err);
        setMedicineSuggestions([]);
      } finally {
        setLoadingMedicines(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl md:text-3xl lg:text-4xl text-[#1E293B] mb-3"
            style={{ fontWeight: 700 }}
          >
            Find Medicines
          </h1>
          <p className="text-lg text-[#64748B]">
            Search for medicines and find nearby pharmacies with availability
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Search Medicines */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h2 className="text-xl text-[#1E293B] mb-4" style={{ fontWeight: 600 }}>
                Search Medicine
              </h2>

              {/* Search Input */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <input
                  type="text"
                  placeholder="Type medicine name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedMedicine(null);
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F7DF3] text-[#1E293B]"
                />
              </div>

              {/* Medicine List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loadingMedicines ? (
                  <div className="py-8 text-center text-[#64748B] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Searching medicines...
                  </div>
                ) : medicineSuggestions.length > 0 ? (
                  medicineSuggestions.map((medicine) => (
                    <button
                      key={medicine.id}
                      onClick={() => setSelectedMedicine(medicine)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedMedicine?.id === medicine.id
                          ? "border-[#4F7DF3] bg-[#4F7DF3]/5"
                          : "border-gray-200 hover:border-[#4F7DF3]/50"
                      }`}
                    >
                      <p
                        className="text-[#1E293B] mb-1"
                        style={{ fontWeight: 600 }}
                      >
                        {medicine.name}
                      </p>
                      <p className="text-sm text-[#64748B]">{medicine.category} · {medicine.brand || medicine.form || "Medicine"}</p>
                    </button>
                  ))
                ) : searchQuery.trim() ? (
                  <p className="text-center text-[#64748B] py-8">
                    No medicines found
                  </p>
                ) : (
                  <p className="text-center text-[#64748B] py-8">
                    Start typing to see real medicine suggestions
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Nearby Pharmacies */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm mb-6">
              <h2 className="text-xl text-[#1E293B] mb-6" style={{ fontWeight: 600 }}>
                All Pharmacies
                {selectedMedicine && (
                  <span className="text-[#64748B] ml-2">
                    - Availability for "{selectedMedicine.name}"
                  </span>
                )}
              </h2>

              <div className="space-y-4">
                {loadingPharmacies ? (
                  <div className="py-12 text-center text-[#64748B] flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Loading pharmacies...
                  </div>
                ) : allPharmacies.length === 0 ? (
                  <div className="py-12 text-center text-[#64748B]">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    No pharmacies available at the moment.
                  </div>
                ) : (
                  (() => {
                    let displayPharmacies = allPharmacies;

                    // If a medicine is selected, ONLY show pharmacies that have it in stock
                    if (selectedMedicine) {
                      displayPharmacies = allPharmacies.filter(
                        (p) => availabilityMap[p.id] !== undefined && availabilityMap[p.id] > 0
                      );
                    } else {
                      // If no medicine selected, sort alphabetically or normally
                      displayPharmacies = [...allPharmacies];
                    }

                    if (selectedMedicine && displayPharmacies.length === 0) {
                      return (
                        <div className="py-12 text-center text-[#64748B]">
                          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30 text-rose-500" />
                          <p>No nearby pharmacies currently have <strong>{selectedMedicine.name}</strong> in stock.</p>
                        </div>
                      );
                    }

                    return displayPharmacies.map((pharmacy) => {
                      const hasStock = selectedMedicine && availabilityMap[pharmacy.id] !== undefined;
                      const quantity = availabilityMap[pharmacy.id] ?? 0;
                      
                      console.log(`Pharmacy ${pharmacy.store_name} (ID: ${pharmacy.id}) - hasStock: ${hasStock}, quantity: ${quantity}, map:`, availabilityMap);

                      return (
                    <div
                      key={pharmacy.id}
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        hasStock
                          ? "border-emerald-200 bg-emerald-50/30"
                          : selectedMedicine
                          ? "border-gray-200 bg-gray-50/30"
                          : "border-gray-200"
                      } hover:border-[#4F7DF3]/50`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3
                              className="text-lg text-[#1E293B]"
                              style={{ fontWeight: 600 }}
                            >
                              {pharmacy.store_name}
                            </h3>
                          </div>

                          <div className="space-y-2 text-sm text-[#64748B]">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span>{[pharmacy.address, pharmacy.city, pharmacy.state, pharmacy.pincode].filter(Boolean).join(", ") || "Address not available"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 flex-shrink-0" />
                              {pharmacy.phone ? (
                                <a
                                  href={`tel:${pharmacy.phone}`}
                                  className="hover:text-[#4F7DF3] transition-colors"
                                >
                                  {pharmacy.phone}
                                </a>
                              ) : (
                                <span>Contact not available</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>{pharmacy.opening_hours || "Hours not available"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 items-start sm:items-end">
                          {selectedMedicine && (
                            hasStock ? (
                              <>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                                  Qty: {quantity}
                                </span>
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                                  <span className="text-sm text-emerald-600" style={{ fontWeight: 600 }}>
                                    In Stock
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-semibold">
                                  Out of Stock
                                </span>
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="w-5 h-5 text-rose-500" />
                                  <span className="text-sm text-rose-600" style={{ fontWeight: 600 }}>
                                    Not Available
                                  </span>
                                </div>
                              </>
                            )
                          )}
                        </div>
                      </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {pharmacy.phone ? (
                        <a
                          href={`tel:${pharmacy.phone}`}
                          className="flex-1 px-6 py-3 bg-[#4F7DF3] text-white rounded-xl hover:bg-[#3D6DE3] transition-colors text-center"
                        >
                          Call Pharmacy
                        </a>
                      ) : (
                        <div className="flex-1 px-6 py-3 bg-[#E2E8F0] text-[#64748B] rounded-xl text-center">
                          Call Unavailable
                        </div>
                      )}
                      <button className="flex-1 px-6 py-3 bg-white text-[#4F7DF3] border-2 border-[#4F7DF3] rounded-xl hover:bg-[#F8FAFC] transition-colors">
                        Get Directions
                      </button>
                    </div>
                  </div>
                  );
                    })
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
