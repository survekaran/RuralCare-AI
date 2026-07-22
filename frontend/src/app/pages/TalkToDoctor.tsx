import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Video, Phone, MessageCircle, Calendar, Clock, User,
  Mic, MicOff, VideoOff, PhoneOff, Loader2, Wifi, WifiOff, Copy, Check as CheckIcon,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toWsUrl } from "../config/runtime";

// ── Config ────────────────────────────────────────────────────────────────────

const SIGNAL_WS_BASE = toWsUrl("/ws/signal");
const _BACKEND_BASE = `${window.location.protocol}//${window.location.host}`;
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type CallStatus = "connecting" | "waiting" | "connected" | "failed" | "ended";

interface Doctor {
  id: number;
  name: string;
  qualification: string;
  specialty: string;
  experience: number;
  fee: number;
  hospital: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  availability: string;   // "Available" | "Busy" | "On Leave"
  consult_mode: string;   // "Video" | "In-Person" | "Both"
  verified: boolean;
  certificate: string | null;
  time_slots?: TimeSlot[];
  appointments?: Appointment[];
}

interface TimeSlot {
  day: string;
  time: string;
  booked?: boolean;
}

interface Appointment {
  appointment_id: number;
  patient_id: number;
  patient_name: string;
  appointment_date: string;
  time_slot: string;
  status: string;
  notes?: string;
}


// ── VideoCallRoom Component ───────────────────────────────────────────────────

function VideoCallRoom({
  roomId,
  doctorName,
  onEnd,
}: {
  roomId: string;
  doctorName: string;
  onEnd: () => void;
}) {
  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef    = useRef<RTCPeerConnection | null>(null);
  const wsRef    = useRef<WebSocket | null>(null);
  const roleRef  = useRef<"initiator" | "receiver" | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus]   = useState<CallStatus>("connecting");
  const [micOn,  setMicOn]    = useState(true);
  const [camOn,  setCamOn]    = useState(true);
  const [copied, setCopied]   = useState(false);

  const endCall = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    wsRef.current?.close();
    onEnd();
  }, [onEnd]);

  useEffect(() => {
    let pc: RTCPeerConnection;
    let ws: WebSocket;

    async function start() {
      // 1. Get camera + mic (fallback to audio-only)
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. Create peer connection
      pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setStatus("connected");
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setStatus("failed");
        }
      };

      // 3. Connect signaling WebSocket
      ws = new WebSocket(`${SIGNAL_WS_BASE}/${roomId}`);
      wsRef.current = ws;

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data as string);

        switch (msg.type) {
          case "joined":
            roleRef.current = msg.role;
            setStatus("waiting");
            if (msg.role === "receiver") {
              ws.send(JSON.stringify({ type: "ready" }));
            }
            break;

          case "peer-joined":
            if (roleRef.current === "initiator") {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              ws.send(JSON.stringify({ type: "offer", sdp: offer.sdp }));
            } else {
              ws.send(JSON.stringify({ type: "ready" }));
            }
            break;

          case "ready":
            if (roleRef.current === "initiator" && !pc.localDescription) {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              ws.send(JSON.stringify({ type: "offer", sdp: offer.sdp }));
            }
            break;

          case "offer":
            await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: msg.sdp }));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: "answer", sdp: answer.sdp }));
            break;

          case "answer":
            await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: msg.sdp }));
            break;

          case "ice-candidate":
            try { await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch { /* ignore */ }
            break;

          case "peer-left":
            setStatus("ended");
            break;

          case "room-full":
            setStatus("failed");
            break;
        }
      };

      ws.onerror = () => setStatus("failed");
    }

    start().catch(() => setStatus("failed"));

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      pc?.close();
      ws?.close();
    };
  }, [roomId]);

  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMicOn(p => !p);
  };

  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamOn(p => !p);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusLabel: Record<CallStatus, string> = {
    connecting: "Connecting…",
    waiting:    "Waiting for the other party…",
    connected:  "Connected",
    failed:     "Connection failed",
    ended:      "Call ended",
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col select-none">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${
            status === "connected"  ? "bg-emerald-400" :
            status === "waiting" || status === "connecting" ? "bg-amber-400 animate-pulse" :
            "bg-rose-400"
          }`} />
          <span className="text-white font-semibold">{doctorName}</span>
          <span className="text-[#94A3B8] text-sm">{statusLabel[status]}</span>
        </div>
        {(status === "connecting" || status === "waiting") && (
          <Loader2 className="w-5 h-5 text-[#4F7DF3] animate-spin" />
        )}
        {status === "connected"  && <Wifi    className="w-5 h-5 text-emerald-400" />}
        {(status === "failed" || status === "ended") && <WifiOff className="w-5 h-5 text-rose-400" />}
      </div>

      {/* Video area */}
      <div className="flex-1 relative bg-[#1E293B] overflow-hidden">
        {/* Remote stream — fills the window */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Overlay when not connected yet */}
        {status !== "connected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0F172A]/80 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-[#4F7DF3]/20 flex items-center justify-center">
              <User className="w-10 h-10 text-[#4F7DF3]" />
            </div>
            <p className="text-white font-semibold text-lg">{doctorName}</p>
            <p className="text-[#94A3B8] text-sm flex items-center gap-2">
              {(status === "connecting" || status === "waiting") && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {statusLabel[status]}
            </p>
            {(status === "connecting" || status === "waiting") && (
              <div className="mt-2 flex items-center gap-2 px-4 py-2.5 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[#94A3B8] text-xs">Room ID:</span>
                <span className="text-[#4F7DF3] font-mono text-xs">{roomId}</span>
                <button
                  onClick={copyRoomId}
                  className="ml-1 text-[#94A3B8] hover:text-white transition-colors"
                  title="Copy Room ID"
                >
                  {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Local video — picture-in-picture */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-4 right-4 w-36 h-24 sm:w-48 sm:h-32 rounded-2xl object-cover border-2 border-white/20 shadow-2xl"
        />
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-center gap-5 py-6 px-4 bg-[#0F172A] border-t border-white/10">
        <button
          onClick={toggleMic}
          title={micOn ? "Mute mic" : "Unmute mic"}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            micOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-rose-500 hover:bg-rose-600 text-white"
          }`}
        >
          {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>

        <button
          onClick={toggleCam}
          title={camOn ? "Turn off camera" : "Turn on camera"}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            camOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-rose-500 hover:bg-rose-600 text-white"
          }`}
        >
          {camOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>

        <button
          onClick={endCall}
          title="End call"
          className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-white shadow-lg transition-colors"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}

// ── Page Component ────────────────────────────────────────────────────────────

export function TalkToDoctor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDoctor, setSelectedDoctor]     = useState<Doctor | null>(null);
  const [consultationType, setConsultationType] = useState<"video" | "audio" | null>(null);

  const [doctors,     setDoctors]     = useState<Doctor[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [fetchError,  setFetchError]  = useState("");

  const [showBooking, setShowBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  useEffect(() => {
    fetch("/doctors/")
      .then((res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return res.json() as Promise<Doctor[]>;
      })
      .then((data) => setDoctors(data))
      .catch((err) => setFetchError(err.message ?? "Failed to load doctors"))
      .finally(() => setLoadingDocs(false));
  }, []);

  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowBooking(false);
    setAvailableSlots([]);
  };

  const openBooking = async () => {
    if (!selectedDoctor) return;
    
    setShowBooking(true);
    setLoadingSlots(true);
    setBookingError("");
    
    try {
      const res = await fetch(`/doctors/${selectedDoctor.id}/available-slots`);
      if (!res.ok) throw new Error("Failed to load available slots");
      const data = await res.json();
      setAvailableSlots(data.slots || []);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "Could not load slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !bookingDate || !bookingTime || !user.name) {
      setBookingError("Please fill in all fields");
      return;
    }
    
    try {
      const res = await fetch(`/doctors/${selectedDoctor.id}/book-appointment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: user.userId || 0,
          patient_name: user.name,
          appointment_date: bookingDate,
          time_slot: bookingTime,
          notes: bookingNotes,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "Booking failed");
      }
      
      setBookingSuccess(`Appointment booked with ${selectedDoctor.name}!`);
      setShowBooking(false);
      setBookingDate("");
      setBookingTime("");
      setBookingNotes("");
      setTimeout(() => setBookingSuccess(""), 4000);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "Booking failed");
    }
  };

  const handleBookAudio = () => {
    if (!selectedDoctor) return;
    alert(`Audio consultation booking for ${selectedDoctor.name} — audio-only calls coming soon.`);
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
            Talk to a Doctor
          </h1>
          <p className="text-lg text-[#64748B]">
            Connect with qualified doctors through video or audio consultation
          </p>
        </div>

        {/* Consultation Type Selection */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm mb-6">
          <h2 className="text-xl text-[#1E293B] mb-4" style={{ fontWeight: 600 }}>
            Choose Consultation Type
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <button
              onClick={() => setConsultationType("video")}
              className={`p-6 rounded-2xl border-2 transition-all ${
                consultationType === "video"
                  ? "border-[#4F7DF3] bg-[#4F7DF3]/5"
                  : "border-gray-200 hover:border-[#4F7DF3]/50"
              }`}
            >
              <Video
                className="w-8 h-8 mx-auto mb-3"
                style={{ color: consultationType === "video" ? "#4F7DF3" : "#64748B" }}
              />
              <p
                className="text-center"
                style={{
                  fontWeight: 600,
                  color: consultationType === "video" ? "#4F7DF3" : "#1E293B",
                }}
              >
                Video Call
              </p>
            </button>

            <button
              onClick={() => setConsultationType("audio")}
              className={`p-6 rounded-2xl border-2 transition-all ${
                consultationType === "audio"
                  ? "border-[#4F7DF3] bg-[#4F7DF3]/5"
                  : "border-gray-200 hover:border-[#4F7DF3]/50"
              }`}
            >
              <Phone
                className="w-8 h-8 mx-auto mb-3"
                style={{ color: consultationType === "audio" ? "#4F7DF3" : "#64748B" }}
              />
              <p
                className="text-center"
                style={{
                  fontWeight: 600,
                  color: consultationType === "audio" ? "#4F7DF3" : "#1E293B",
                }}
              >
                Audio Call
              </p>
            </button>

            <button
              onClick={() => navigate("/test-chat")}
              className="p-6 rounded-2xl border-2 border-gray-200 hover:border-[#4F7DF3]/50 transition-all"
            >
              <MessageCircle className="w-8 h-8 text-[#64748B] mx-auto mb-3" />
              <p className="text-center text-[#1E293B]" style={{ fontWeight: 600 }}>
                Chat
              </p>
            </button>
          </div>

          {/* Video Call CTA — shown immediately when Video selected, no doctor selection needed */}
          {consultationType === "video" && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-sm text-[#64748B] mb-4">
                You’ll receive a shareable invite link — send it to your doctor so they can join the call.
              </p>
              <button
                onClick={() => navigate(`/test-call?room=room-${Date.now()}`)}
                className="w-full px-8 py-4 bg-[#4F7DF3] text-white rounded-2xl hover:bg-[#3D6DE3] transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <Video className="w-5 h-5" /> Start Video Call
              </button>
            </div>
          )}
        </div>

        {/* Available Doctors */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm mb-6">
          <h2 className="text-xl text-[#1E293B] mb-6" style={{ fontWeight: 600 }}>
            {consultationType === "audio" ? "Select a Doctor for Audio Consultation" : "Available Doctors"}
          </h2>

          {/* Loading */}
          {loadingDocs && (
            <div className="flex items-center justify-center py-12 gap-3 text-[#64748B]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading doctors…</span>
            </div>
          )}

          {/* Error */}
          {!loadingDocs && fetchError && (
            <div className="py-6 px-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm text-center">
              {fetchError}
            </div>
          )}

          {/* Empty */}
          {!loadingDocs && !fetchError && doctors.length === 0 && (
            <div className="py-12 text-center text-[#64748B]">
              No doctors are registered yet.
            </div>
          )}

          {/* Doctor cards */}
          {!loadingDocs && !fetchError && doctors.length > 0 && (
            <div className="grid gap-4">
              {doctors.map((doctor) => {
                const isAvailable = doctor.availability === "Available";
                return (
                  <button
                    key={doctor.id}
                    onClick={() => handleSelectDoctor(doctor)}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                      selectedDoctor?.id === doctor.id
                        ? "border-[#4F7DF3] bg-[#4F7DF3]/5"
                        : "border-gray-200 hover:border-[#4F7DF3]/50"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#4F7DF3]/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-8 h-8 text-[#4F7DF3]" />
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <div>
                            <h3 className="text-lg text-[#1E293B]" style={{ fontWeight: 600 }}>
                              {doctor.name}
                            </h3>
                            <p className="text-[#64748B]">
                              {doctor.specialty}
                              {doctor.qualification ? ` · ${doctor.qualification}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isAvailable ? (
                              <span className="px-3 py-1 bg-[#A7E3C9] text-[#1E293B] rounded-full text-sm">
                                Available
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-gray-200 text-[#64748B] rounded-full text-sm">
                                {doctor.availability}
                              </span>
                            )}
                            {doctor.verified && (
                              <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-[#64748B]">
                          {doctor.experience > 0 && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{doctor.experience} yr{doctor.experience !== 1 ? "s" : ""} experience</span>
                            </div>
                          )}
                          {doctor.hospital && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{doctor.hospital}{doctor.city ? `, ${doctor.city}` : ""}</span>
                            </div>
                          )}
                          {Number(doctor.fee) > 0 && (
                            <div className="flex items-center gap-1">
                              <span style={{ fontWeight: 600 }}>Fee: ₹{doctor.fee}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Book Appointment Button */}
        {selectedDoctor && (
          <div className="bg-white rounded-2xl p-6 shadow-sm sticky bottom-4 space-y-3">
            {bookingSuccess && (
              <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
                ✓ {bookingSuccess}
              </div>
            )}
            <button
              onClick={openBooking}
              className="w-full px-8 py-4 bg-[#4F7DF3] text-white rounded-2xl hover:bg-[#3D6DE3] transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <Calendar className="w-5 h-5" /> Book Appointment
            </button>
            {consultationType === "audio" && (
              <button
                onClick={handleBookAudio}
                className="w-full px-8 py-4 bg-white border-2 border-[#4F7DF3] text-[#4F7DF3] rounded-2xl hover:bg-[#F8FAFC] transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <Phone className="w-5 h-5" /> Audio Consultation
              </button>
            )}
          </div>
        )}

        {/* Booking Modal */}
        {showBooking && selectedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-[rgba(0,0,0,0.06)] flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-bold text-[#1E293B]">Book Appointment</h2>
                  <p className="text-sm text-[#64748B] mt-1">{selectedDoctor.name}</p>
                </div>
                <button
                  onClick={() => setShowBooking(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F8FAFC] text-[#64748B] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleBookAppointment();
                }}
                className="px-6 py-5 space-y-5"
              >
                {bookingError && (
                  <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                    {bookingError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Select Date *</label>
                  <input
                    required
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3.5 py-2.5 border border-[rgba(0,0,0,0.1)] rounded-xl text-sm text-[#1E293B] bg-white outline-none transition focus:border-[#4F7DF3] focus:ring-2 focus:ring-[#4F7DF3]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-2">Select Time *</label>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-6 text-[#64748B] gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading available slots...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="py-6 text-center text-[#64748B] text-sm">
                      No available slots found. Please select a different date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={`${slot.day}_${slot.time}`}
                          type="button"
                          onClick={() => setBookingTime(slot.time)}
                          disabled={slot.booked}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                            slot.booked
                              ? "bg-gray-100 text-[#94A3B8] cursor-not-allowed opacity-50"
                              : bookingTime === slot.time
                              ? "bg-[#4F7DF3] text-white"
                              : "bg-[#F8FAFC] border border-[rgba(0,0,0,0.08)] text-[#1E293B] hover:border-[#4F7DF3]"
                          }`}
                        >
                          {slot.time}
                          {slot.booked && <span className="text-[10px] block mt-0.5">Booked</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Notes (Optional)</label>
                  <textarea
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Any additional notes or symptoms..."
                    className="w-full px-3.5 py-2.5 border border-[rgba(0,0,0,0.1)] rounded-xl text-sm text-[#1E293B] bg-white outline-none transition focus:border-[#4F7DF3] focus:ring-2 focus:ring-[#4F7DF3]/20 placeholder:text-[#94A3B8] resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBooking(false)}
                    className="flex-1 py-2.5 rounded-full border border-[rgba(0,0,0,0.1)] text-[#64748B] hover:bg-[#F8FAFC] transition-colors text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!bookingDate || !bookingTime}
                    className="flex-1 py-2.5 rounded-full bg-[#4F7DF3] hover:bg-[#3D6DE3] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors shadow-[0_2px_10px_rgba(79,125,243,0.3)]"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
