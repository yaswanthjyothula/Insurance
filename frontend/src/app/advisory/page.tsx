"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Calendar, 
  Video, 
  Phone, 
  MessageSquare, 
  AlertCircle, 
  Send, 
  Download, 
  FileText, 
  RefreshCw,
  BadgeCheck,
  UserCheck
} from "lucide-react";
import { JourneyProgress } from "@/components/layout/journey-progress";
import { useAssessmentStore } from "@/store/assessment-store";
import { formatINR } from "@/lib/utils";
import { fetchFromAPI } from "@/lib/api";
import { Advisor, BookingConfirmation } from "@/types/advisory";

export default function AdvisoryPage() {
  const { 
    result, 
    selectedProduct, 
    customization, 
    booking, 
    setBooking, 
    isHydrated 
  } = useAssessmentStore();

  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [isLoadingAdvisors, setIsLoadingAdvisors] = useState(false);
  
  // Booking Form State
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [consultationMode, setConsultationMode] = useState<"video" | "voice" | "chat">("video");
  const [userName, setUserName] = useState("Praveen Sharma");
  const [userEmail, setUserEmail] = useState("praveen.sharma@example.com");
  const [userPhone, setUserPhone] = useState("9876543210");
  const [userNotes, setUserNotes] = useState("Want to confirm if critical illness rider is recommended for a 32-year-old.");
  
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Simulated Consultation Room State
  const [consultationActive, setConsultationActive] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: "advisor" | "user"; text: string; time: string }>>([]);
  const [inputMessage, setInputMessage] = useState("");

  const loadAdvisors = () => {
    setIsLoadingAdvisors(true);
    fetchFromAPI("/advisory/availability")
      .then((data: Advisor[]) => {
        setAdvisors(data);
        if (data.length > 0 && !selectedAdvisorId) {
          setSelectedAdvisorId(data[0].id);
          if (data[0].available_slots && data[0].available_slots.length > 0) {
            setSelectedSlot(data[0].available_slots[0]);
          }
        }
      })
      .catch((err) => {
        console.error("Error loading advisors:", err);
      })
      .finally(() => {
        setIsLoadingAdvisors(false);
      });
  };

  useEffect(() => {
    if (isHydrated) {
      loadAdvisors();
      if (booking) {
        setConsultationActive(true);
        initConsultationMessages(booking.advisor_name);
      }
    }
  }, [isHydrated, booking]);

  const activeAdvisor = advisors.find((a) => a.id === selectedAdvisorId);

  const handleAdvisorSelect = (adv: Advisor) => {
    setSelectedAdvisorId(adv.id);
    if (adv.available_slots && adv.available_slots.length > 0) {
      setSelectedSlot(adv.available_slots[0]);
    } else {
      setSelectedSlot("");
    }
  };

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdvisorId || !selectedSlot) {
      setBookingError("Please select an advisor and an available consultation time slot.");
      return;
    }

    setIsBooking(true);
    setBookingError(null);

    try {
      const confirmation: BookingConfirmation = await fetchFromAPI("/advisory/bookings", {
        method: "POST",
        body: JSON.stringify({
          advisor_id: selectedAdvisorId,
          preferred_slot: selectedSlot,
          user_name: userName,
          user_email: userEmail,
          user_phone: userPhone,
          notes: userNotes,
          assessment_id: result?.assessment_id,
          share_passport: true
        })
      });

      setBooking(confirmation);
      setConsultationActive(true);
      initConsultationMessages(confirmation.advisor_name);
      loadAdvisors();
    } catch (err: any) {
      console.error("Booking error:", err);
      setBookingError(err.message || "Failed to confirm booking. This slot might already be reserved.");
    } finally {
      setIsBooking(false);
    }
  };

  const initConsultationMessages = (advisorName: string) => {
    const gapFormatted = formatINR(result?.net_needs?.net_coverage_gap ?? 12500000, { compact: true });
    const productTitle = selectedProduct ? selectedProduct.name : "Click 2 Protect Super";
    const coverFormatted = formatINR(customization?.sum_assured ?? 15000000, { compact: true });

    setMessages([
      {
        sender: "advisor",
        text: `Hello ${userName}! I'm ${advisorName}. I've reviewed your LifeSure Protection Assessment. Your family coverage gap is ${gapFormatted}, and you've selected ${productTitle} for ${coverFormatted} sum assured.`,
        time: "Just now"
      },
      {
        sender: "advisor",
        text: `Your plan structures liability clearance for your home loan and an income replacement safety fund across your 20-year support horizon. What specific questions can I answer regarding rider selection or tax deductions under Section 80C?`,
        time: "Just now"
      }
    ]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    setInputMessage("");

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userText, time: "Just now" }
    ]);

    setTimeout(() => {
      let reply = `Under Section 45 of the Insurance Act 1938, transparent health disclosure ensures complete claim incontestability after 3 years. We will verify this before proposal submission.`;
      if (userText.toLowerCase().includes("rider") || userText.toLowerCase().includes("critical")) {
        reply = `The Critical Illness rider pays an immediate lump sum upon first diagnosis of major illnesses, independent of hospital bills. Given your dependency horizon, keeping it active provides essential wage protection.`;
      } else if (userText.toLowerCase().includes("tax") || userText.toLowerCase().includes("80c")) {
        reply = `Under Section 80C, your annual premium of ₹${formatINR(customization?.estimated_annual_premium ?? 14500)} is tax-deductible up to ₹1.5 Lakhs/year. The death benefit payout to your nominee is completely tax-free under Section 10(10D).`;
      }

      setMessages((prev) => [
        ...prev,
        { sender: "advisor", text: reply, time: "Just now" }
      ]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col text-[#24212B]">
      <JourneyProgress currentStage={4} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-10">
        {/* Stage Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-[#FFFFFF] p-6 rounded-xl border border-[#D9D3E8]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#FFFFFF] text-[#7957FF] border border-[#7957FF] text-xs font-extrabold mb-2">
              <Users className="w-3.5 h-3.5 text-[#7957FF]" />
              Stage 4 of 4: Digital Advisory & Fiduciary Consultation
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#24212B] tracking-tight">
              {consultationActive ? "Simulated Consultation Room" : "Book a Certified Advisory Session"}
            </h1>
            <p className="text-sm font-medium text-[#4A4553] mt-1">
              Fiduciary advice aligned with IRDAI guidelines. Connect with Certified Financial Planners (CFP®) to review your policy.
            </p>
          </div>

          {consultationActive && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#7957FF] text-[#FFFFFF] text-xs font-extrabold">
                <span className="w-2 h-2 rounded-full bg-[#FFFFFF] animate-pulse" />
                Session Active (Demo Simulator)
              </span>
              <button
                onClick={() => setConsultationActive(false)}
                className="px-3 py-1.5 rounded border border-[#D9D3E8] text-xs font-bold text-[#24212B] bg-[#FFFFFF] hover:bg-[#FFFFFF]"
              >
                Change Booking
              </button>
            </div>
          )}
        </div>

        {!consultationActive ? (
          /* Booking Flow */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Advisor Directory (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-xs font-bold text-[#7957FF] uppercase tracking-wider">
                Select an Advisor ({advisors.length} Available)
              </h2>

              {isLoadingAdvisors ? (
                <div className="p-8 text-center bg-[#FFFFFF] rounded-xl border border-[#D9D3E8]">
                  <RefreshCw className="w-6 h-6 text-[#24212B] animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#24212B]">Checking advisor calendars...</p>
                </div>
              ) : (
                advisors.map((adv) => {
                  const isSelected = selectedAdvisorId === adv.id;
                  const hasSlots = adv.available_slots && adv.available_slots.length > 0;

                  return (
                    <div
                      key={adv.id}
                      onClick={() => handleAdvisorSelect(adv)}
                      className={`p-6 rounded-xl border transition-all cursor-pointer bg-[#FFFFFF] ${
                        isSelected
                          ? "border-2 border-[#7957FF] shadow-lg shadow-[#7957FF]/10"
                          : "border border-[#D9D3E8] hover:border-[#7957FF]"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-[#FFFFFF] text-[#24212B] border border-[#D9D3E8] flex items-center justify-center font-extrabold text-base">
                            {adv.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-base font-extrabold text-[#24212B]">{adv.name}</h3>
                              <BadgeCheck className="w-4 h-4 text-[#24212B]" />
                            </div>
                            <p className="text-xs text-[#4A4553] font-medium">{adv.title}</p>
                            <span className="text-[11px] text-[#7957FF] font-bold">{adv.credentials}</span>
                          </div>
                        </div>

                        <span className="text-xs font-extrabold text-[#FFFFFF] bg-[#7957FF] px-2.5 py-1 rounded">
                          {adv.experience_years}+ Yrs Exp
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {adv.specialties.map((spec, i) => (
                          <span key={i} className="text-[11px] font-medium px-2.5 py-0.5 rounded bg-[#FFFFFF] text-[#24212B] border border-[#D9D3E8]">
                            {spec}
                          </span>
                        ))}
                      </div>

                      {/* Available Slots */}
                      <div>
                        <span className="text-[11px] font-bold text-[#7957FF] uppercase tracking-wider block mb-2">
                          Available Time Slots:
                        </span>
                        {hasSlots ? (
                          <div className="flex flex-wrap gap-2">
                            {adv.available_slots.map((slot) => {
                              const isSlotChosen = isSelected && selectedSlot === slot;
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAdvisorId(adv.id);
                                    setSelectedSlot(slot);
                                  }}
                                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                                    isSlotChosen
                                      ? "bg-[#7957FF] text-[#FFFFFF] border-[#7957FF]"
                                      : "bg-[#FFFFFF] text-[#24212B] border-[#D9D3E8] hover:border-[#7957FF]"
                                  }`}
                                >
                                  {slot}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-[#6F6A7C] font-bold">
                            Fully booked for this week. Please select another advisor.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: Booking Form (5 cols) */}
            <div className="lg:col-span-5">
              <form onSubmit={handleBookSession} className="bg-[#FFFFFF] rounded-xl border-2 border-[#7957FF] p-6 sticky top-36 shadow-2xl">
                <div className="border-b border-[#D9D3E8] pb-4 mb-5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#7957FF] uppercase tracking-wider mb-1">
                    <Calendar className="w-3.5 h-3.5 text-[#7957FF]" />
                    Appointment Details
                  </div>
                  <h3 className="text-lg font-extrabold text-[#24212B]">
                    {activeAdvisor ? `Consult with ${activeAdvisor.name}` : "Book Advisory Session"}
                  </h3>
                  <p className="text-xs font-medium text-[#4A4553]">
                    Selected Slot: <strong className="text-[#24212B] font-extrabold">{selectedSlot || "None chosen"}</strong>
                  </p>
                </div>

                {bookingError && (
                  <div className="mb-4 p-3 rounded bg-[#FFFFFF] border border-[#7957FF] text-[#7957FF] flex items-center gap-2 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#7957FF]" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Consultation Mode */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-[#24212B] uppercase tracking-wider mb-2">
                    Consultation Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "video", label: "Video Call", icon: Video },
                      { id: "voice", label: "Phone Call", icon: Phone },
                      { id: "chat", label: "Secure Chat", icon: MessageSquare }
                    ].map((m) => {
                      const Icon = m.icon;
                      const active = consultationMode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setConsultationMode(m.id as any)}
                          className={`p-2.5 rounded border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
                            active
                              ? "bg-[#7957FF] text-[#FFFFFF] border-[#7957FF]"
                              : "border-[#D9D3E8] text-[#24212B] bg-[#FFFFFF] hover:border-[#7957FF]"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Contact Inputs */}
                <div className="space-y-3 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-[#24212B] uppercase mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-[#D9D3E8] bg-[#FFFFFF] text-sm font-bold text-[#24212B] focus:outline-none focus:ring-1 focus:ring-[#7957FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#24212B] uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-[#D9D3E8] bg-[#FFFFFF] text-sm font-bold text-[#24212B] focus:outline-none focus:ring-1 focus:ring-[#7957FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#24212B] uppercase mb-1">Mobile Number (India)</label>
                    <input
                      type="tel"
                      required
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-[#D9D3E8] bg-[#FFFFFF] text-sm font-bold text-[#24212B] focus:outline-none focus:ring-1 focus:ring-[#7957FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#24212B] uppercase mb-1">Specific Questions or Notes</label>
                    <textarea
                      rows={2}
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-[#D9D3E8] bg-[#FFFFFF] text-xs font-medium text-[#24212B] focus:outline-none focus:ring-1 focus:ring-[#7957FF]"
                      placeholder="e.g. Inquire about smoker loading, rider suitability, or claim history..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBooking || !selectedSlot}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded bg-[#7957FF] hover:bg-[#6444E6] text-[#FFFFFF] text-sm font-extrabold transition-all disabled:opacity-60 shadow-lg"
                >
                  {isBooking ? (
                    <span>Confirming Schedule...</span>
                  ) : (
                    <>
                      Confirm & Open Consultation Room
                      <UserCheck className="w-4 h-4 text-[#FFFFFF]" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Simulated Consultation Room */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Sidebar: Assessment & Policy Summary (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#FFFFFF] rounded-xl border border-[#D9D3E8] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-[#7957FF]" />
                  <h3 className="text-xs font-extrabold text-[#7957FF] uppercase tracking-wider">
                    Client Assessment Passport
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded bg-[#FFFFFF] border border-[#7957FF]">
                    <span className="text-[#4A4553] font-bold block">Calculated Coverage Gap</span>
                    <span className="text-lg font-black text-[#24212B] tabular-nums">
                      {formatINR(result?.net_needs?.net_coverage_gap ?? 12500000)}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-[#FFFFFF] border border-[#D9D3E8] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#4A4553] font-medium">Selected Product:</span>
                      <span className="font-bold text-[#24212B] truncate max-w-[150px]">
                        {selectedProduct?.name || "Click 2 Protect Super"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A4553] font-medium">Insurer:</span>
                      <span className="font-bold text-[#24212B]">
                        {selectedProduct?.insurer || "HDFC Life"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A4553] font-medium">Custom Sum Assured:</span>
                      <span className="font-extrabold text-[#24212B] tabular-nums">
                        {formatINR(customization?.sum_assured ?? 15000000, { compact: true })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A4553] font-medium">Tenure:</span>
                      <span className="font-bold text-[#24212B]">
                        {customization?.tenure_years ?? 30} Years
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A4553] font-medium">Indicative Premium:</span>
                      <span className="font-extrabold text-[#7957FF] tabular-nums">
                        {formatINR(customization?.estimated_monthly_premium ?? 1208)}/mo
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#D9D3E8]">
                  <button
                    onClick={() => window.print()}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded border border-[#D9D3E8] text-xs font-bold text-[#24212B] bg-[#FFFFFF] hover:bg-[#FFFFFF]"
                  >
                    <Download className="w-3.5 h-3.5 text-[#24212B]" />
                    Download Policy Blueprint (PDF)
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Simulated Interactive Chat Window (8 cols) */}
            <div className="lg:col-span-8">
              <div className="bg-[#FFFFFF] rounded-xl border border-[#D9D3E8] flex flex-col h-[560px]">
                {/* Chat Header */}
                <div className="p-4 border-b border-[#D9D3E8] flex items-center justify-between bg-[#FFFFFF] rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#7957FF] text-[#FFFFFF] flex items-center justify-center font-extrabold text-sm">
                      {booking?.advisor_name?.split(" ")[0]?.[0] || "A"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-extrabold text-[#24212B]">{booking?.advisor_name || "Certified Advisor"}</h4>
                        <span className="w-2 h-2 rounded-full bg-[#7957FF] animate-pulse" />
                      </div>
                      <p className="text-xs text-[#4A4553] font-medium">Fiduciary Protection Specialist • Slot: {booking?.slot || "Confirmed"}</p>
                    </div>
                  </div>

                  <span className="text-xs text-[#FFFFFF] font-extrabold bg-[#7957FF] px-2.5 py-1 rounded">
                    Simulated Session
                  </span>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4">
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded p-4 text-xs leading-relaxed ${
                          m.sender === "user"
                            ? "bg-[#FFFFFF] text-[#24212B] border-2 border-[#7957FF] font-medium"
                            : "bg-[#FFFFFF] text-[#24212B] border border-[#7957FF] font-medium"
                        }`}
                      >
                        <div className="font-extrabold mb-1 text-[11px] uppercase tracking-wider text-[#7957FF]">
                          {m.sender === "user" ? "You" : booking?.advisor_name || "Advisor"}
                        </div>
                        <p>{m.text}</p>
                        <span className="text-[10px] block mt-1.5 text-right font-medium text-[#6F6A7C]">{m.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input Bar */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-[#D9D3E8] bg-[#FFFFFF] rounded-b-xl flex items-center gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about claim settlement, critical illness rider, or tax benefits under 80C..."
                    className="flex-1 px-4 py-2.5 rounded border border-[#D9D3E8] bg-[#FFFFFF] text-xs font-bold text-[#24212B] focus:outline-none focus:ring-1 focus:ring-[#7957FF]"
                  />
                  <button
                    type="submit"
                    className="p-2.5 rounded bg-[#7957FF] hover:bg-[#6444E6] text-[#FFFFFF] transition-all"
                  >
                    <Send className="w-4 h-4 text-[#FFFFFF]" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Global End-of-Journey Review Bar */}
        <div className="mt-8 bg-[#FFFFFF] p-6 rounded-xl border border-[#D9D3E8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/products"
            className="text-xs font-bold text-[#24212B] hover:text-[#7957FF] transition-all"
          >
            ← Modify Product Selection
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 rounded bg-[#FFFFFF] hover:bg-[#FFFFFF] text-[#24212B] text-xs font-bold border border-[#D9D3E8] transition-all"
            >
              Back to Home Overview
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded bg-[#7957FF] hover:bg-[#6444E6] text-[#FFFFFF] text-xs font-extrabold transition-all shadow"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
