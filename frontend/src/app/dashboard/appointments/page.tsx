"use client";

import React, { useState, useEffect } from "react";
import { Users, Calendar, CheckCircle2, Video } from "lucide-react";
import { fetchFromAPI } from "@/lib/api";

export default function BookAdvisorPage() {
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [name, setName] = useState("Praveen Sharma");
  const [email, setEmail] = useState("praveen.sharma@example.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [notes, setNotes] = useState("");
  const [sharePassport, setSharePassport] = useState(true);

  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFromAPI("/advisors").then((data) => {
      setAdvisors(data || []);
      if (data && data.length > 0) {
        setSelectedAdvisor(data[0].id);
        setSelectedSlot(data[0].available_slots[0] || "");
      }
    }).catch(() => {});
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchFromAPI("/advisor-bookings", {
        method: "POST",
        body: JSON.stringify({
          advisor_id: selectedAdvisor,
          user_name: name,
          user_email: email,
          user_phone: phone,
          preferred_slot: selectedSlot,
          notes: notes,
          share_passport: sharePassport
        })
      });
      setBookingConfirmation(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#FFFFFF] text-[#24212B]">
      
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FFFFFF] text-[#7957FF] border border-[#7957FF]/40 text-xs font-extrabold uppercase tracking-wider">
          <Users className="w-3.5 h-3.5 text-[#7957FF]" />
          <span>Fiduciary Advisory Service</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] tracking-tight">
          Book an Accredited Advisor
        </h1>
        <p className="text-sm font-medium text-[#4A4553] max-w-xl mx-auto">
          Consult with certified financial planners (CFP®) who operate strictly on a fiduciary fee basis, 
          with zero insurer commission conflicts.
        </p>
      </div>

      {bookingConfirmation ? (
        <div className="p-8 rounded-xl bg-[#FFFFFF] border-2 border-[#7957FF] shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FFFFFF] text-[#24212B] border border-[#7957FF] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-[#24212B]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#24212B]">
            Appointment Confirmed!
          </h2>
          <p className="text-xs font-medium text-[#4A4553] max-w-md mx-auto leading-relaxed">
            Your 30-minute video advisory session with <strong className="text-[#7957FF]">{bookingConfirmation.advisor_name}</strong> has been scheduled for <strong className="text-[#24212B]">{bookingConfirmation.slot}</strong>.
          </p>

          <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#D9D3E8] text-xs max-w-sm mx-auto space-y-1">
            <div className="text-[#6F6A7C] font-medium">Meeting Room Link:</div>
            <a href={bookingConfirmation.meeting_link} target="_blank" rel="noreferrer" className="text-[#24212B] font-extrabold hover:text-[#7957FF] flex items-center justify-center gap-1.5 transition-colors">
              <Video className="w-4 h-4 text-[#24212B]" />
              <span>{bookingConfirmation.meeting_link}</span>
            </a>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setBookingConfirmation(null)}
              className="text-xs font-extrabold text-[#7957FF] underline hover:text-[#24212B] transition-colors"
            >
              Book Another Appointment
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleBook} className="bg-[#FFFFFF] border border-[#D9D3E8] rounded-xl p-6 sm:p-8 space-y-6 text-[#24212B]">
          <h2 className="text-sm font-extrabold text-[#24212B] border-b border-[#D9D3E8] pb-3 uppercase tracking-wider">
            Schedule Video Consultation
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-extrabold text-[#24212B] block mb-2">
                Select Certified Fiduciary Advisor:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {advisors.map((adv) => (
                  <div
                    key={adv.id}
                    onClick={() => {
                      setSelectedAdvisor(adv.id);
                      setSelectedSlot(adv.available_slots[0] || "");
                    }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedAdvisor === adv.id
                        ? "border-2 border-[#7957FF] bg-[#FFFFFF] text-[#24212B]"
                        : "border-[#D9D3E8] bg-[#FFFFFF]/60 hover:border-[#7957FF]/50 text-[#24212B]"
                    }`}
                  >
                    <div className="font-extrabold text-[#24212B] text-sm">{adv.name}</div>
                    <div className="text-[11px] text-[#7957FF] font-bold mb-1">{adv.credentials}</div>
                    <div className="text-[10px] text-[#6F6A7C] font-medium">{adv.experience_years} yrs exp | Fiduciary Aligned</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="font-extrabold text-[#24212B] block mb-2">
                Available Video Slots:
              </label>
              <div className="flex flex-wrap gap-2">
                {advisors
                  .find((a) => a.id === selectedAdvisor)
                  ?.available_slots.map((s: string, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSlot(s)}
                      className={`px-3 py-2 rounded-lg text-xs font-extrabold border transition-all ${
                        selectedSlot === s
                          ? "bg-[#7957FF] text-[#FFFFFF] border-[#7957FF]"
                          : "border-[#D9D3E8] text-[#24212B] bg-[#FFFFFF] hover:border-[#7957FF]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="font-bold text-[#24212B] block mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D9D3E8] rounded-lg bg-[#FFFFFF] text-[#24212B] font-bold text-sm focus:outline-none focus:ring-1 focus:ring-[#7957FF]"
                />
              </div>

              <div>
                <label className="font-bold text-[#24212B] block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D9D3E8] rounded-lg bg-[#FFFFFF] text-[#24212B] font-bold text-sm focus:outline-none focus:ring-1 focus:ring-[#7957FF]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#24212B] block mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-[#D9D3E8] rounded-lg bg-[#FFFFFF] text-[#24212B] font-bold text-sm focus:outline-none focus:ring-1 focus:ring-[#7957FF]"
              />
            </div>

            <div>
              <label className="font-bold text-[#24212B] block mb-1">Questions / Specific Topics</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Critical illness rider evaluation, smoker classification, underwriting guidelines..."
                className="w-full px-3 py-2 border border-[#D9D3E8] rounded-lg bg-[#FFFFFF] text-[#24212B] font-medium text-xs focus:outline-none focus:ring-1 focus:ring-[#7957FF]"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-[#24212B]">
                <input
                  type="checkbox"
                  checked={sharePassport}
                  onChange={(e) => setSharePassport(e.target.checked)}
                  className="w-4 h-4 rounded text-[#24212B] accent-[#7957FF]"
                />
                <span>Share my calculated Protection Gap & Assessment summary with advisor</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-[#D9D3E8]">
            <button
              type="submit"
              disabled={loading || !selectedSlot}
              className="w-full py-3 px-6 bg-[#7957FF] hover:bg-[#6444E6] text-[#FFFFFF] font-extrabold rounded border border-[#7957FF] transition-all disabled:opacity-60"
            >
              {loading ? "Confirming Booking..." : "Confirm Free Fiduciary Consultation"}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
