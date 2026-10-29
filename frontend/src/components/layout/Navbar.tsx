"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ChevronDown, 
  Menu, 
  X, 
  Search, 
  ShieldCheck, 
  Calculator, 
  Layers, 
  FileText, 
  Activity, 
  Compass, 
  LayoutDashboard,
  User,
  Lock,
  Calendar,
  LogOut,
  LogIn,
  CheckCircle2,
  Sliders
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAssessmentStore } from "@/store/assessment-store";
import { formatINR } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { input, result } = useAssessmentStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
    setProfileOpen(false);
  }, [pathname]);

  const insuranceCategories = [
    { name: "Term Insurance", href: "/insurance/term", desc: "Pure cover for your family if you die" },
    { name: "Life Insurance (traditional)", href: "/insurance/life", desc: "Guaranteed savings with life cover" },
    { name: "Health Insurance", href: "/insurance/health", desc: "Hospital bills and critical illness" },
    { name: "General (home, motor, travel)", href: "/insurance/general", desc: "Home, motor and travel cover" },
    { name: "Investment-Linked (ULIP)", href: "/insurance/investment-linked", desc: "Cover plus market-linked investing" },
    { name: "Business Insurance", href: "/insurance/business", desc: "Keyman, group term and director cover" },
    { name: "Cyber & Accident", href: "/insurance/other", desc: "Online fraud and accident cover" },
  ];

  const journeyStages = [
    { name: "Stage 1: Needs Assessment", href: "/assessment", icon: Calculator, badge: "Stage 1" },
    { name: "Stage 2: Coverage Results", href: "/results", icon: ShieldCheck, badge: "Stage 2" },
    { name: "Stage 3: Product Recommendations", href: "/products", icon: Layers, badge: "Stage 3" },
    { name: "Stage 4: Digital Advisory", href: "/advisory", icon: FileText, badge: "Stage 4" },
  ];

  const smartTools = [
    { name: "Life Cover Calculator", href: "/tools/life-cover-calculator", icon: Calculator, badge: "Flagship" },
    { name: "Scenario Studio", href: "/tools/scenario-studio", icon: Layers, badge: "What-if" },
    { name: "Family Survival Simulator", href: "/tools/family-survival-simulator", icon: Activity, badge: "Cashflow" },
    { name: "Protection Gap Analyzer", href: "/tools/protection-gap", icon: ShieldCheck, badge: "Gap" },
    { name: "Policy X-Ray", href: "/tools/policy-xray", icon: FileText, badge: "AI Document" },
    { name: "Premium Affordability", href: "/tools/affordability-calculator", icon: Calculator, badge: "Budget" },
    { name: "EMI & Debt Shield", href: "/tools/emi-calculator", icon: Calculator, badge: "Debt" },
    { name: "Policy Replacement Check", href: "/tools/policy-replacement", icon: FileText, badge: "Objective" },
    { name: "Premium Shock Simulator", href: "/tools/premium-shock", icon: Activity, badge: "Stress-test" },
    { name: "Future Costs Reality Check", href: "/tools/future-costs", icon: Activity, badge: "Inflation" },
    { name: "Scam Shield", href: "/tools/scam-shield", icon: ShieldCheck, badge: "Defence" },
    { name: "Application Readiness", href: "/tools/application-readiness", icon: FileText, badge: "Underwriting" },
    { name: "Explore All 12 Smart Tools", href: "/tools", icon: Compass, badge: "All" },
  ];


  const resources = [
    { name: "Insurance Learning Centre", href: "/resources/learning-centre" },
    { name: "Insurance Glossary", href: "/resources/glossary" },
    { name: "Insurer Directory (IRDAI)", href: "/resources/insurance-companies" },
    { name: "Claim Companion Guide", href: "/resources/claims" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[rgba(250,249,246,0.82)] backdrop-blur-[16px] border-b border-[rgba(217,211,232,0.6)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[76px]">
          
          {/* Logo Section */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-0.5" ref={dropdownRef}>
            
            {/* 4-Stage Core Journey Dropdown */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === "journey" ? null : "journey")}
                className="flex items-center gap-1.5 px-3.5 py-2 text-[15px] font-medium whitespace-nowrap text-[#24212B] hover:text-[#7957FF] rounded-md transition-colors"
                aria-expanded={activeDropdown === "journey"}
              >
                <span>Needs Finder</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "journey" ? "rotate-180" : ""}`} />
              </button>

              {activeDropdown === "journey" && (
                <div className="absolute left-0 mt-2 w-96 bg-[#FFFFFF] border border-[#D9D3E8] rounded-2xl shadow-[0_30px_60px_rgba(121,87,255,0.13)] py-2 px-1 z-50">
                  <div className="px-3 py-1 mb-1 border-b border-[#D9D3E8]">
                    <span className="text-[11px] font-bold tracking-wider text-[#7957FF] uppercase">Your 4-Stage Journey</span>
                  </div>
                  {journeyStages.map((tool) => {
                    const IconComp = tool.icon;
                    return (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#E9E4FF] transition-colors"
                        onClick={() => setActiveDropdown(null)}
                      >
                        <div className="flex items-center gap-2.5">
                          <IconComp className="w-4 h-4 text-[#24212B]" />
                          <span className="text-sm font-bold text-[#24212B]">{tool.name}</span>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E9E4FF] text-[#7957FF] border border-[rgba(121,87,255,0.2)]">{tool.badge}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Insurance Categories Dropdown */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === "insurance" ? null : "insurance")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#4A4553] hover:text-[#24212B] hover:bg-[rgba(36,33,43,0.06)] rounded-full transition-all"
                aria-expanded={activeDropdown === "insurance"}
              >
                <span>Insurance</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "insurance" ? "rotate-180" : ""}`} />
              </button>

              {activeDropdown === "insurance" && (
                <div className="absolute left-0 mt-2 w-80 bg-[#FFFFFF] border border-[#D9D3E8] rounded-2xl shadow-[0_30px_60px_rgba(121,87,255,0.13)] py-2 px-1 z-50">
                  <div className="px-3 py-1 mb-1 border-b border-[#D9D3E8]">
                    <span className="text-[11px] font-bold tracking-wider text-[#7957FF] uppercase">7 Insurance Categories</span>
                  </div>
                  {insuranceCategories.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2 rounded hover:bg-[#E9E4FF] transition-colors"
                      onClick={() => setActiveDropdown(null)}
                    >
                      <div className="text-sm font-bold text-[#24212B]">{item.name}</div>
                      <div className="text-xs text-[#4A4553]">{item.desc}</div>
                    </Link>
                  ))}
                  <div className="pt-2 mt-1 border-t border-[#D9D3E8] px-2">
                    <Link
                      href="/insurance"
                      className="block text-center py-1.5 text-xs font-bold text-[#7957FF] hover:underline"
                      onClick={() => setActiveDropdown(null)}
                    >
                      Browse Complete Insurance Directory →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Smart Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === "tools" ? null : "tools")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#4A4553] hover:text-[#24212B] hover:bg-[rgba(36,33,43,0.06)] rounded-full transition-all"
                aria-expanded={activeDropdown === "tools"}
              >
                <span>Smart Tools</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "tools" ? "rotate-180" : ""}`} />
              </button>

              {activeDropdown === "tools" && (
                <div className="absolute left-0 mt-2 w-96 max-h-[70vh] overflow-y-auto bg-[#FFFFFF] border border-[#D9D3E8] rounded-2xl shadow-[0_30px_60px_rgba(121,87,255,0.13)] py-2 px-1 z-50">
                  <div className="px-3 py-1 mb-1 border-b border-[#D9D3E8]">
                    <span className="text-[11px] font-bold tracking-wider text-[#7957FF] uppercase">12 Smart Tools</span>
                  </div>
                  {smartTools.map((tool) => {
                    const IconComp = tool.icon;
                    return (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        className="flex items-center justify-between px-3 py-2 rounded hover:bg-[#E9E4FF] transition-colors"
                        onClick={() => setActiveDropdown(null)}
                      >
                        <div className="flex items-center gap-2.5">
                          <IconComp className="w-4 h-4 text-[#24212B]" />
                          <span className="text-sm font-bold text-[#24212B]">{tool.name}</span>
                        </div>
                        {tool.badge && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#FFFFFF] text-[#24212B] border border-[#D9D3E8]">
                            {tool.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resources Dropdown */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === "resources" ? null : "resources")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#4A4553] hover:text-[#24212B] hover:bg-[rgba(36,33,43,0.06)] rounded-full transition-all"
                aria-expanded={activeDropdown === "resources"}
              >
                <span>Resources</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "resources" ? "rotate-180" : ""}`} />
              </button>

              {activeDropdown === "resources" && (
                <div className="absolute left-0 mt-2 w-72 bg-[#FFFFFF] border border-[#D9D3E8] rounded-2xl shadow-[0_30px_60px_rgba(121,87,255,0.13)] py-2 px-1 z-50">
                  <div className="px-3 py-1 mb-1 border-b border-[#D9D3E8]">
                    <span className="text-[11px] font-bold tracking-wider text-[#7957FF] uppercase">Knowledge Base</span>
                  </div>
                  {resources.map((res) => (
                    <Link
                      key={res.href}
                      href={res.href}
                      className="block px-3.5 py-2 text-sm font-semibold whitespace-nowrap text-[#24212B] hover:bg-[#E9E4FF] rounded-xl transition-colors"
                      onClick={() => setActiveDropdown(null)}
                    >
                      {res.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>



          </nav>

          {/* Action CTAs & Controls */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Quick Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-[#24212B] hover:bg-[#E9E4FF] rounded-xl transition-colors"
              aria-label="Search tools and insurance terms"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* User Profile Flyout (Replaces Dashboard) */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setActiveDropdown(null);
                }}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-3 rounded-full border border-[#D9D3E8] bg-white hover:border-[#7957FF] hover:shadow-md transition-all group"
                aria-label="User Profile"
                aria-expanded={profileOpen}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7957FF] to-[#9A80FF] text-white flex items-center justify-center font-bold text-xs shadow-sm relative">
                  {user ? (user.email?.[0]?.toUpperCase() || "U") : (input.annual_income > 0 ? "P" : "G")}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#0E9F7E] border-2 border-white rounded-full"></span>
                </div>
                <div className="text-left hidden xl:block">
                  <div className="text-xs font-bold text-[#24212B] leading-none group-hover:text-[#7957FF] transition-colors">
                    {user ? (user.user_metadata?.full_name || user.email?.split("@")[0]) : (input.annual_income > 0 ? "Praveen Sharma" : "Guest Client")}
                  </div>
                  <div className="text-[10px] text-[#6F6A7C] leading-tight font-medium mt-0.5">
                    {user ? "Verified Account" : (input.annual_income > 0 ? "Profile Active" : "Get Started")}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[#6F6A7C] transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Profile Flyout Popover */}
              {profileOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white border border-[#D9D3E8] rounded-3xl shadow-[0_25px_60px_rgba(121,87,255,0.18)] p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-[#24212B]">
                  {/* Identity Header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-[#D9D3E8]">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#7957FF] to-[#9A80FF] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                      {user ? (user.email?.[0]?.toUpperCase() || "U") : (input.annual_income > 0 ? "PS" : "GC")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-[#24212B] truncate block">
                          {user ? (user.user_metadata?.full_name || user.email?.split("@")[0]) : (input.annual_income > 0 ? "Praveen Sharma" : "Guest Client")}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0E9F7E] flex-shrink-0" />
                      </div>
                      <span className="text-[11px] text-[#6F6A7C] truncate block">
                        {user ? user.email : (input.annual_income > 0 ? "praveen.sharma@example.com" : "Assessment in progress")}
                      </span>
                      <span className="inline-block mt-0.5 text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E9E4FF] text-[#7957FF]">
                        {user ? "Retail Banking Client" : "Assessment Active"}
                      </span>
                    </div>
                  </div>

                  {/* Financial Snapshot Card */}
                  <div className="my-3 p-3 rounded-2xl bg-[#FAF9F6] border border-[#D9D3E8]/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#6F6A7C]">
                      <span>Financial Profile Details</span>
                      <Link 
                        href="/assessment" 
                        onClick={() => setProfileOpen(false)}
                        className="text-[#7957FF] hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-white border border-[#D9D3E8]/60">
                        <span className="text-[10px] text-[#6F6A7C] block">Age / Dependents</span>
                        <span className="font-extrabold text-[#24212B] mt-0.5 block">
                          {input.age || 32} yrs • {input.dependents_count || 2} dep
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-[#D9D3E8]/60">
                        <span className="text-[10px] text-[#6F6A7C] block">Annual Income</span>
                        <span className="font-extrabold text-[#24212B] mt-0.5 block">
                          {input.annual_income ? formatINR(input.annual_income) : "₹18,00,000"}
                        </span>
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-[#D9D3E8]/60 flex items-center justify-between">
                      <span className="text-[10px] text-[#6F6A7C]">Calculated Gap</span>
                      <span className="text-xs font-extrabold text-[#7957FF]">
                        {result?.net_needs?.net_coverage_gap ? formatINR(result.net_needs.net_coverage_gap) : "₹1.35 Crore"}
                      </span>
                    </div>
                  </div>

                  {/* User Profile Links */}
                  <div className="space-y-1 pt-1">
                    <Link
                      href="/dashboard/protection-passport"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#24212B] hover:bg-[#E9E4FF] rounded-xl transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#7957FF]" />
                      <span>My Protection Passport</span>
                    </Link>
                    <Link
                      href="/dashboard/insurance-vault"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#24212B] hover:bg-[#E9E4FF] rounded-xl transition-colors"
                    >
                      <Lock className="w-4 h-4 text-[#7957FF]" />
                      <span>Emergency Insurance Vault</span>
                    </Link>
                    <Link
                      href="/dashboard/appointments"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#24212B] hover:bg-[#E9E4FF] rounded-xl transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-[#7957FF]" />
                      <span>Consultation Bookings</span>
                    </Link>
                    <Link
                      href="/dashboard/policies"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#24212B] hover:bg-[#E9E4FF] rounded-xl transition-colors"
                    >
                      <FileText className="w-4 h-4 text-[#7957FF]" />
                      <span>My Policies & Quotes</span>
                    </Link>
                  </div>

                  {/* Auth Footer */}
                  <div className="pt-3 mt-2 border-t border-[#D9D3E8]">
                    {user ? (
                      <button
                        onClick={() => {
                          signOut();
                          setProfileOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-[#D32F2F] hover:bg-[#FFEBEE] rounded-xl transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    ) : (
                      <Link
                        href="/sign-in"
                        onClick={() => setProfileOpen(false)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-white bg-[#7957FF] hover:bg-[#6444E6] rounded-xl transition-colors shadow-sm"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In / Register</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 lg:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-[#24212B] hover:bg-[#E9E4FF] rounded"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#24212B] hover:bg-[#E9E4FF] rounded"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#D9D3E8] bg-[#FFFFFF] px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/assessment"
            className="block px-3 py-2 rounded text-base font-bold text-[#24212B] hover:bg-[#E9E4FF]"
          >
            4-Stage Needs Assessment
          </Link>
          <Link
            href="/insurance"
            className="block px-3 py-2 rounded text-base font-bold text-[#24212B] hover:bg-[#E9E4FF]"
          >
            All Insurance Categories
          </Link>
          <Link
            href="/tools"
            className="block px-3 py-2 rounded text-base font-bold text-[#24212B] hover:bg-[#E9E4FF]"
          >
            Smart Financial Tools
          </Link>
          <Link
            href="/resources"
            className="block px-3 py-2 rounded text-base font-bold text-[#24212B] hover:bg-[#E9E4FF]"
          >
            Resources & Claims Guide
          </Link>

          <div className="pt-4 border-t border-[#D9D3E8] space-y-3">
            {/* User Profile Card in Mobile */}
            <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#D9D3E8] space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#7957FF] to-[#9A80FF] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {user ? (user.email?.[0]?.toUpperCase() || "U") : (input.annual_income > 0 ? "PS" : "GC")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#24212B] truncate">
                    {user ? (user.user_metadata?.full_name || user.email?.split("@")[0]) : (input.annual_income > 0 ? "Praveen Sharma" : "Guest Client")}
                  </div>
                  <div className="text-[10px] text-[#6F6A7C] truncate">
                    {user ? user.email : (input.annual_income > 0 ? "praveen.sharma@example.com" : "Assessment in progress")}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                <Link
                  href="/dashboard/protection-passport"
                  className="p-2 rounded-xl bg-white border border-[#D9D3E8] font-bold text-[#24212B] flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#7957FF]" />
                  <span>Passport</span>
                </Link>
                <Link
                  href="/dashboard/insurance-vault"
                  className="p-2 rounded-xl bg-white border border-[#D9D3E8] font-bold text-[#24212B] flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-[#7957FF]" />
                  <span>Vault</span>
                </Link>
              </div>
            </div>

            {user ? (
              <button 
                onClick={signOut} 
                className="block w-full text-center py-2 text-xs font-bold text-[#D32F2F] border border-[#D9D3E8] rounded-xl hover:bg-[#FFEBEE]"
              >
                Sign Out ({user.email})
              </button>
            ) : (
              <Link
                href="/sign-in"
                className="block w-full text-center py-2.5 text-xs font-bold text-white bg-[#7957FF] rounded-xl hover:bg-[#6444E6]"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Quick Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-[#24212B]/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
          <div className="bg-[#FFFFFF] border border-[#7957FF] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#D9D3E8] flex items-center gap-3">
              <Search className="w-5 h-5 text-[#24212B]" />
              <input
                type="text"
                placeholder="Search tools, terms (e.g. HLV, Claim Settlement, Term...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-transparent border-none outline-none text-[#24212B] placeholder-[#A59FB5] text-base font-medium"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-xs px-2.5 py-1 bg-[#FFFFFF] text-[#24212B] font-bold rounded border border-[#D9D3E8]"
              >
                ESC
              </button>
            </div>
            <div className="p-3 max-h-80 overflow-y-auto space-y-1">
              <div className="text-[11px] font-bold text-[#7957FF] uppercase px-3 py-1">Quick Links</div>
              <Link
                href="/assessment"
                onClick={() => setSearchOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded hover:bg-[#E9E4FF]"
              >
                <span className="text-sm font-bold text-[#24212B]">Stage 1: Needs Assessment</span>
                <span className="text-xs font-bold text-[#FFFFFF] bg-[#7957FF] px-2 py-0.5 rounded">Core Journey</span>
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setSearchOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded hover:bg-[#E9E4FF]"
              >
                <span className="text-sm font-bold text-[#24212B]">Dashboard Overview</span>
                <span className="text-xs font-bold text-[#FFFFFF] bg-[#7957FF] px-2 py-0.5 rounded">Portal</span>
              </Link>
              <Link
                href="/tools/scenario-studio"
                onClick={() => setSearchOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded hover:bg-[#E9E4FF]"
              >
                <span className="text-sm font-bold text-[#24212B]">Scenario Studio (What-If Analysis)</span>
                <span className="text-xs font-bold text-[#FFFFFF] bg-[#6444E6] px-2 py-0.5 rounded">Tool</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
