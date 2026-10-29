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
  LayoutDashboard
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/components/auth/AuthProvider";

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  const insuranceCategories = [
    { name: "Term Insurance", href: "/insurance/term", desc: "Pure income replacement & debt protection" },
    { name: "Life Insurance", href: "/insurance/life", desc: "Traditional endowment & whole-life plans" },
    { name: "Health Insurance", href: "/insurance/health", desc: "Hospitalization, OPD & critical illness" },
    { name: "General Insurance", href: "/insurance/general", desc: "Home, motor, property & travel cover" },
    { name: "Investment-Linked", href: "/insurance/investment-linked", desc: "ULIPs & market wealth creation" },
    { name: "Business Insurance", href: "/insurance/business", desc: "Keyman, group term & liability protection" },
    { name: "Other Insurance", href: "/insurance/other", desc: "Personal cyber & accident sachet covers" },
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

  const advisoryItems = [
    { name: "My Protection Passport", href: "/dashboard/protection-passport", icon: ShieldCheck },
    { name: "Advisory Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Saved Scenarios", href: "/tools/scenario-studio", icon: Activity },
    { name: "Consultation Bookings", href: "/dashboard/appointments", icon: FileText },
    { name: "Emergency Insurance Vault", href: "/dashboard/insurance-vault", icon: ShieldCheck },
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

            {/* Advisory Dropdown */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === "advisory" ? null : "advisory")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#4A4553] hover:text-[#24212B] hover:bg-[rgba(36,33,43,0.06)] rounded-full transition-all"
                aria-expanded={activeDropdown === "advisory"}
              >
                <span>Advisory</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "advisory" ? "rotate-180" : ""}`} />
              </button>

              {activeDropdown === "advisory" && (
                <div className="absolute left-0 mt-2 w-80 bg-[#FFFFFF] border border-[#D9D3E8] rounded-2xl shadow-[0_30px_60px_rgba(121,87,255,0.13)] py-2 px-1 z-50">
                  <div className="px-3 py-1 mb-1 border-b border-[#D9D3E8]">
                    <span className="text-[11px] font-bold tracking-wider text-[#7957FF] uppercase">Personal Protection Portal</span>
                  </div>
                  {advisoryItems.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-[#E9E4FF] transition-colors"
                        onClick={() => setActiveDropdown(null)}
                      >
                        <IconComp className="w-4 h-4 text-[#24212B]" />
                        <span className="text-sm font-bold text-[#24212B]">
                          {item.name}
                        </span>
                      </Link>
                    );
                  })}
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

            {user ? (
              <button
                onClick={signOut}
                title={user.email ?? undefined}
                className="px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-md text-[#24212B] border border-[#D9D3E8] hover:border-[#7957FF]"
              >
                Sign Out
              </button>
            ) : (
            <Link
              href="/sign-in"
              className="px-3.5 py-2 text-[15px] font-medium whitespace-nowrap text-[#24212B] hover:text-[#7957FF] rounded-md transition-colors"
            >
              Sign In
            </Link>
            )}

            {/* MANDATORY TOP-RIGHT ACTION: Dashboard in Neon Noir (Neon Green bg, Black text, Restrained Rectangular) */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-3 text-[15px] font-semibold text-[#FFFFFF] bg-[#7957FF] hover:brightness-110 hover:-translate-y-0.5 border-0 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-[#7957FF] focus:ring-offset-2 focus:ring-offset-[#FFFFFF]"
            >
              <LayoutDashboard className="w-4 h-4 text-[#FFFFFF]" />
              <span>Dashboard</span>
            </Link>
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

          <div className="pt-4 border-t border-[#D9D3E8] space-y-2">
            {/* MANDATORY MOBILE CTA: Dashboard */}
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 w-full text-center py-2.5 text-sm font-extrabold text-[#FFFFFF] bg-[#7957FF] hover:bg-[#6444E6] rounded"
            >
              <LayoutDashboard className="w-4 h-4 text-[#FFFFFF]" />
              <span>Dashboard</span>
            </Link>
            {user ? (
              <button onClick={signOut} className="block w-full text-center py-2 text-sm font-bold text-[#24212B] border border-[#D9D3E8] rounded hover:bg-[#E9E4FF]">
                Sign Out ({user.email})
              </button>
            ) : (
            <Link
              href="/sign-in"
              className="block w-full text-center py-2 text-sm font-bold text-[#24212B] border border-[#D9D3E8] rounded hover:bg-[#E9E4FF]"
            >
              Sign In
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
