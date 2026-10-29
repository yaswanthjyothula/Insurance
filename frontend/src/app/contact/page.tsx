"use client";

import React, { useState } from "react";
import { Mail, MapPin, Phone, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
      
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">
          REACH OUR EDITORIAL & ADVISORY TEAM
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#24212B] dark:text-white">
          Contact & Grievance Redressal
        </h1>
        <p className="text-sm text-[#6F6A7C] dark:text-[#A59FB5] max-w-xl">
          Have an inquiry, feedback on an actuarial calculation, or need assistance? Reach out to our Bengaluru team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Contact Information */}
        <div className="bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-xs text-[#6F6A7C] dark:text-[#A59FB5]">
          <h2 className="text-base font-bold text-[#24212B] dark:text-white border-b border-[#D9D3E8] dark:border-[#1E2D4A] pb-3">
            Registered Headquarters
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#7957FF] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#24212B] dark:text-white block">LifeSure AI Technologies Pvt. Ltd.</strong>
                <span>Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103, India</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#7957FF] flex-shrink-0" />
              <div>
                <strong className="text-[#24212B] dark:text-white block">Support & Inquiries</strong>
                <span>support@lifesure.ai</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#7957FF] flex-shrink-0" />
              <div>
                <strong className="text-[#24212B] dark:text-white block">Direct Helpline</strong>
                <span>+91 (080) 4123 8890 (Mon - Fri, 9:30 AM - 6:00 PM IST)</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#142447] border border-[#D9D3E8] dark:border-[#1E2D4A] space-y-1">
            <span className="font-bold text-[#24212B] dark:text-white">Grievance Redressal</span>
            <p className="text-[11px]">
              For complaints regarding data privacy under DPDP Act 2023 or IT Rules 2021, contact: <strong>grievance@lifesure.ai</strong>
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-[#0E1A33] border border-[#D9D3E8] dark:border-[#1E2D4A] rounded-2xl p-6 sm:p-8 shadow-sm space-y-4 text-xs">
          <h2 className="text-base font-bold text-[#24212B] dark:text-white border-b border-[#D9D3E8] dark:border-[#1E2D4A] pb-3">
            Send an Online Inquiry
          </h2>

          {submitted ? (
            <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">Message Received</h3>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Thank you for contacting us. Our advisory team will respond to {email} within 24 business hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-semibold block mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full p-2.5 rounded-lg border border-[#D9D3E8] dark:border-[#1E2D4A] bg-[#FAF9F6] dark:bg-[#142447]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Your Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  className="w-full p-2.5 rounded-lg border border-[#D9D3E8] dark:border-[#1E2D4A] bg-[#FAF9F6] dark:bg-[#142447]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Your Message</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we assist your financial planning journey?"
                  className="w-full p-2.5 rounded-lg border border-[#D9D3E8] dark:border-[#1E2D4A] bg-[#FAF9F6] dark:bg-[#142447]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#7957FF] hover:bg-[#6444E6] text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Submit Message</span>
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
