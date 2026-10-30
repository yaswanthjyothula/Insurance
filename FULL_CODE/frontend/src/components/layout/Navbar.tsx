"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Menu,
  X,
  Search,
  FileText,
  Calendar,
  LogOut,
  LogIn,
  UserRound,
  Settings as SettingsIcon,
  Briefcase,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/components/auth/AuthProvider";
import { displayLogin } from "@/components/auth/session-helpers";
import { useAssessmentStore } from "@/store/assessment-store";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/en";

type NavItem = { nameKey: MessageKey; href: string; descKey?: MessageKey };

export function Navbar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata.full_name ?? t("layout.nav.guest");
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const { input } = useAssessmentStore();
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is read from browser storage or fetched after mount
    setMobileMenuOpen(false);
    setActiveDropdown(null);
    setProfileOpen(false);
  }, [pathname]);

  const insuranceCategories: NavItem[] = [
    { nameKey: "layout.nav.insurance.term", href: "/insurance/term", descKey: "layout.nav.insurance.termDesc" },
    { nameKey: "layout.nav.insurance.life", href: "/insurance/life", descKey: "layout.nav.insurance.lifeDesc" },
    { nameKey: "layout.nav.insurance.health", href: "/insurance/health", descKey: "layout.nav.insurance.healthDesc" },
    { nameKey: "layout.nav.insurance.general", href: "/insurance/general", descKey: "layout.nav.insurance.generalDesc" },
    { nameKey: "layout.nav.insurance.ulip", href: "/insurance/investment-linked", descKey: "layout.nav.insurance.ulipDesc" },
    { nameKey: "layout.nav.insurance.business", href: "/insurance/business", descKey: "layout.nav.insurance.businessDesc" },
    { nameKey: "layout.nav.insurance.other", href: "/insurance/other", descKey: "layout.nav.insurance.otherDesc" },
  ];

  const journeyStages: NavItem[] = [
    { nameKey: "layout.nav.journey.assessment", href: "/assessment", descKey: "layout.nav.journey.assessmentDesc" },
    { nameKey: "layout.nav.journey.results", href: "/results", descKey: "layout.nav.journey.resultsDesc" },
    { nameKey: "layout.nav.journey.products", href: "/products", descKey: "layout.nav.journey.productsDesc" },
    { nameKey: "layout.nav.journey.advisory", href: "/advisory", descKey: "layout.nav.journey.advisoryDesc" },
  ];

  const smartTools: NavItem[] = [
    { nameKey: "layout.nav.tool.lifeCover", href: "/tools/life-cover-calculator", descKey: "layout.nav.tool.lifeCoverDesc" },
    { nameKey: "layout.nav.tool.scenario", href: "/tools/scenario-studio", descKey: "layout.nav.tool.scenarioDesc" },
    { nameKey: "layout.nav.tool.survival", href: "/tools/family-survival-simulator", descKey: "layout.nav.tool.survivalDesc" },
    { nameKey: "layout.nav.tool.gap", href: "/tools/protection-gap", descKey: "layout.nav.tool.gapDesc" },
    { nameKey: "layout.nav.tool.xray", href: "/tools/policy-xray", descKey: "layout.nav.tool.xrayDesc" },
    { nameKey: "layout.nav.tool.affordability", href: "/tools/affordability-calculator", descKey: "layout.nav.tool.affordabilityDesc" },
    { nameKey: "layout.nav.tool.emi", href: "/tools/emi-calculator", descKey: "layout.nav.tool.emiDesc" },
    { nameKey: "layout.nav.tool.replacement", href: "/tools/policy-replacement", descKey: "layout.nav.tool.replacementDesc" },
    { nameKey: "layout.nav.tool.shock", href: "/tools/premium-shock", descKey: "layout.nav.tool.shockDesc" },
    { nameKey: "layout.nav.tool.futureCosts", href: "/tools/future-costs", descKey: "layout.nav.tool.futureCostsDesc" },
    { nameKey: "layout.nav.tool.scam", href: "/tools/scam-shield", descKey: "layout.nav.tool.scamDesc" },
    { nameKey: "layout.nav.tool.readiness", href: "/tools/application-readiness", descKey: "layout.nav.tool.readinessDesc" },
  ];

  const resources: NavItem[] = [
    { nameKey: "layout.nav.resource.learning", href: "/resources/learning-centre" },
    { nameKey: "layout.nav.resource.glossary", href: "/resources/glossary" },
    { nameKey: "layout.nav.resource.insurers", href: "/resources/insurance-companies" },
    { nameKey: "layout.nav.resource.claims", href: "/resources/claims" },
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
                <span>{t("layout.nav.needsFinder")}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "journey" ? "rotate-180" : ""}`} />
              </button>

              {activeDropdown === "journey" && (
                <div className="absolute start-0 mt-2 w-80 bg-[#FFFFFF] border border-[#D9D3E8] rounded-2xl shadow-[0_25px_60px_rgba(121,87,255,0.14)] p-2 z-50">
                  <div className="px-3 py-1.5 mb-1 border-b border-[#D9D3E8]">
                    <span className="text-[11px] font-bold tracking-wider text-[#7957FF] uppercase">{t("layout.nav.journeyHeading")}</span>
                  </div>
                  {journeyStages.map((stage) => (
                    <Link
                      key={stage.href}
                      href={stage.href}
                      className="block px-3 py-2.5 rounded-xl hover:bg-[#E9E4FF] transition-colors group"
                      onClick={() => setActiveDropdown(null)}
                    >
                      <div className="text-sm font-bold text-[#24212B] group-hover:text-[#7957FF] transition-colors leading-snug">
                        {t(stage.nameKey)}
                      </div>
                      <div className="text-xs text-[#6F6A7C] leading-tight mt-0.5">{stage.descKey && t(stage.descKey)}</div>
                    </Link>
                  ))}
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
                <span>{t("layout.nav.insurance")}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "insurance" ? "rotate-180" : ""}`}
                />
              </button>

              {activeDropdown === "insurance" && (
                <div className="absolute start-0 mt-2 w-80 bg-[#FFFFFF] border border-[#D9D3E8] rounded-2xl shadow-[0_30px_60px_rgba(121,87,255,0.13)] py-2 px-1 z-50">
                  <div className="px-3 py-1 mb-1 border-b border-[#D9D3E8]">
                    <span className="text-[11px] font-bold tracking-wider text-[#7957FF] uppercase">
                      {t("layout.nav.insuranceHeading")}
                    </span>
                  </div>
                  {insuranceCategories.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2 rounded hover:bg-[#E9E4FF] transition-colors"
                      onClick={() => setActiveDropdown(null)}
                    >
                      <div className="text-sm font-bold text-[#24212B]">{t(item.nameKey)}</div>
                      <div className="text-xs text-[#4A4553]">{item.descKey && t(item.descKey)}</div>
                    </Link>
                  ))}
                  <div className="pt-2 mt-1 border-t border-[#D9D3E8] px-2">
                    <Link
                      href="/insurance"
                      className="block text-center py-1.5 text-xs font-bold text-[#7957FF] hover:underline"
                      onClick={() => setActiveDropdown(null)}
                    >
                      {t("layout.nav.browseDirectory")}
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
                <span>{t("layout.nav.smartTools")}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "tools" ? "rotate-180" : ""}`} />
              </button>

              {activeDropdown === "tools" && (
                <div className="absolute start-0 mt-2 w-80 max-h-[70vh] overflow-y-auto bg-[#FFFFFF] border border-[#D9D3E8] rounded-2xl shadow-[0_30px_60px_rgba(121,87,255,0.13)] py-2 px-1 z-50">
                  <div className="px-3 py-1 mb-1 border-b border-[#D9D3E8]">
                    <span className="text-[11px] font-bold tracking-wider text-[#7957FF] uppercase">{t("layout.nav.toolsHeading")}</span>
                  </div>
                  {smartTools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className="block px-3 py-2 rounded-xl hover:bg-[#E9E4FF] transition-colors group"
                      onClick={() => setActiveDropdown(null)}
                    >
                      <div className="text-sm font-bold text-[#24212B] group-hover:text-[#7957FF] transition-colors">{t(tool.nameKey)}</div>
                      <div className="text-xs text-[#6F6A7C]">{tool.descKey && t(tool.descKey)}</div>
                    </Link>
                  ))}
                  <div className="pt-2 mt-1 border-t border-[#D9D3E8] px-2">
                    <Link
                      href="/tools"
                      className="block text-center py-1.5 text-xs font-bold text-[#7957FF] hover:underline"
                      onClick={() => setActiveDropdown(null)}
                    >
                      {t("layout.nav.exploreTools")}
                    </Link>
                  </div>
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
                <span>{t("layout.nav.resources")}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "resources" ? "rotate-180" : ""}`}
                />
              </button>

              {activeDropdown === "resources" && (
                <div className="absolute start-0 mt-2 w-72 bg-[#FFFFFF] border border-[#D9D3E8] rounded-2xl shadow-[0_30px_60px_rgba(121,87,255,0.13)] py-2 px-1 z-50">
                  <div className="px-3 py-1 mb-1 border-b border-[#D9D3E8]">
                    <span className="text-[11px] font-bold tracking-wider text-[#7957FF] uppercase">
                      {t("layout.nav.resourcesHeading")}
                    </span>
                  </div>
                  {resources.map((res) => (
                    <Link
                      key={res.href}
                      href={res.href}
                      className="block px-3.5 py-2 text-sm font-semibold whitespace-nowrap text-[#24212B] hover:bg-[#E9E4FF] rounded-xl transition-colors"
                      onClick={() => setActiveDropdown(null)}
                    >
                      {t(res.nameKey)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Action CTAs & Controls */}
          <div className="hidden lg:flex items-center space-x-3">
            <LanguageSwitcher />
            {/* Quick Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-[#24212B] hover:bg-[#E9E4FF] rounded-xl transition-colors"
              aria-label={t("layout.nav.searchAria")}
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
                className="flex items-center gap-2.5 p-1.5 ps-2.5 pe-3 rounded-full border border-[#D9D3E8] bg-white hover:border-[#7957FF] hover:shadow-md transition-all group"
                aria-label={t("layout.nav.profileAria")}
                aria-expanded={profileOpen}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7957FF] to-[#9A80FF] text-white flex items-center justify-center font-bold text-xs shadow-sm relative">
                  {avatarInitial}
                  <span className="absolute bottom-0 end-0 w-2.5 h-2.5 bg-[#0E9F7E] border-2 border-white rounded-full"></span>
                </div>
                <div className="text-start hidden xl:block">
                  <div className="text-xs font-bold text-[#24212B] leading-none group-hover:text-[#7957FF] transition-colors">
                    {displayName}
                  </div>
                  <div className="text-[10px] text-[#6F6A7C] leading-tight font-medium mt-0.5">
                    {user ? t("layout.nav.myAccount") : t("common.signIn")}
                  </div>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#6F6A7C] transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Profile Flyout Popover */}
              {profileOpen && (
                <div className="absolute end-0 mt-2.5 w-80 bg-white border border-[#D9D3E8] rounded-3xl shadow-[0_25px_60px_rgba(121,87,255,0.18)] p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-[#24212B]">
                  {/* Identity */}
                  <div className="flex items-center gap-3 pb-3 border-b border-[#D9D3E8]">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#7957FF] to-[#9A80FF] text-white flex items-center justify-center font-extrabold text-base shrink-0">
                      {avatarInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-extrabold text-[#24212B] truncate block">{displayName}</span>
                      <span className="text-[12px] text-[#6F6A7C] truncate block">
                        {user ? displayLogin(user.email) : t("layout.nav.signInToSave")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-3">
                    {user && (
                      <Link
                        href="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-[#24212B] hover:bg-[#E9E4FF] rounded-xl transition-colors"
                      >
                        <FileText className="w-4 h-4 text-[#7957FF]" />
                        <span>{t("layout.nav.myPlan")}</span>
                      </Link>
                    )}
                    {user && (
                      <>
                        <Link
                          href="/dashboard/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-[#24212B] hover:bg-[#E9E4FF] rounded-xl transition-colors"
                        >
                          <UserRound className="w-4 h-4 text-[#7957FF]" />
                          <span>{t("layout.nav.profile")}</span>
                        </Link>
                        <Link
                          href="/dashboard/settings"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-[#24212B] hover:bg-[#E9E4FF] rounded-xl transition-colors"
                        >
                          <SettingsIcon className="w-4 h-4 text-[#7957FF]" />
                          <span>{t("layout.nav.settings")}</span>
                        </Link>
                      </>
                    )}
                    {user?.role === "advisor" && (
                      <Link
                        href="/advisor"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-[#24212B] hover:bg-[#E9E4FF] rounded-xl transition-colors"
                      >
                        <Briefcase className="w-4 h-4 text-[#7957FF]" />
                        <span>{t("layout.nav.advisorWorkspace")}</span>
                      </Link>
                    )}
                    <Link
                      href="/assessment"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-[#24212B] hover:bg-[#E9E4FF] rounded-xl transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-[#7957FF]" />
                      <span>{input.annual_income > 0 ? t("layout.nav.updateAnswers") : t("layout.nav.startAssessment")}</span>
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
                        <span>{t("layout.nav.signOut")}</span>
                      </button>
                    ) : (
                      <Link
                        href="/sign-in"
                        onClick={() => setProfileOpen(false)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-white bg-[#7957FF] hover:bg-[#6444E6] rounded-xl transition-colors shadow-sm"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>{t("layout.nav.signInRegister")}</span>
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
              aria-label={t("layout.nav.searchShort")}
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#24212B] hover:bg-[#E9E4FF] rounded"
              aria-label={t("layout.nav.toggleMenu")}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#D9D3E8] bg-[#FFFFFF] px-4 pt-3 pb-6 space-y-3">
          <Link href="/assessment" className="block px-3 py-2 rounded text-base font-bold text-[#24212B] hover:bg-[#E9E4FF]">
            {t("layout.nav.mobile.assessment")}
          </Link>
          <Link href="/insurance" className="block px-3 py-2 rounded text-base font-bold text-[#24212B] hover:bg-[#E9E4FF]">
            {t("layout.nav.mobile.insurance")}
          </Link>
          <Link href="/tools" className="block px-3 py-2 rounded text-base font-bold text-[#24212B] hover:bg-[#E9E4FF]">
            {t("layout.nav.mobile.tools")}
          </Link>
          <Link href="/resources" className="block px-3 py-2 rounded text-base font-bold text-[#24212B] hover:bg-[#E9E4FF]">
            {t("layout.nav.mobile.resources")}
          </Link>

          <div className="pt-4 border-t border-[#D9D3E8] space-y-3">
            <LanguageSwitcher />
            {/* User Profile Card in Mobile */}
            <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#D9D3E8] space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#7957FF] to-[#9A80FF] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {avatarInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#24212B] truncate">{displayName}</div>
                  <div className="text-[10px] text-[#6F6A7C] truncate">{user ? user.email : t("layout.nav.mobile.notSignedIn")}</div>
                </div>
              </div>

              {user && (
                <Link
                  href="/dashboard"
                  className="p-2 rounded-xl bg-white border border-[#D9D3E8] font-bold text-[#24212B] flex items-center gap-1.5 text-[12px]"
                >
                  <FileText className="w-3.5 h-3.5 text-[#7957FF]" />
                  <span>{t("layout.nav.myPlan")}</span>
                </Link>
              )}
            </div>

            {user ? (
              <button
                onClick={signOut}
                className="block w-full text-center py-2 text-xs font-bold text-[#D32F2F] border border-[#D9D3E8] rounded-xl hover:bg-[#FFEBEE]"
              >
                {t("layout.nav.mobile.signOutEmail", { email: user.email })}
              </button>
            ) : (
              <Link
                href="/sign-in"
                className="block w-full text-center py-2.5 text-xs font-bold text-white bg-[#7957FF] rounded-xl hover:bg-[#6444E6]"
              >
                {t("layout.nav.signInRegister")}
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
                placeholder={t("layout.nav.search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-transparent border-none outline-none text-[#24212B] placeholder-[#A59FB5] text-base font-medium"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-xs px-2.5 py-1 bg-[#FFFFFF] text-[#24212B] font-bold rounded border border-[#D9D3E8]"
              >
                {t("layout.nav.search.esc")}
              </button>
            </div>
            <div className="p-3 max-h-80 overflow-y-auto space-y-1">
              <div className="text-[11px] font-bold text-[#7957FF] uppercase px-3 py-1">{t("layout.nav.search.quickLinks")}</div>
              <Link
                href="/assessment"
                onClick={() => setSearchOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded hover:bg-[#E9E4FF]"
              >
                <span className="text-sm font-bold text-[#24212B]">{t("layout.nav.search.stage1")}</span>
                <span className="text-xs font-bold text-[#FFFFFF] bg-[#7957FF] px-2 py-0.5 rounded">
                  {t("layout.nav.search.coreJourney")}
                </span>
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setSearchOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded hover:bg-[#E9E4FF]"
              >
                <span className="text-sm font-bold text-[#24212B]">{t("layout.nav.myPlan")}</span>
                <span className="text-xs font-bold text-[#FFFFFF] bg-[#7957FF] px-2 py-0.5 rounded">{t("layout.nav.search.account")}</span>
              </Link>
              <Link
                href="/tools/scenario-studio"
                onClick={() => setSearchOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded hover:bg-[#E9E4FF]"
              >
                <span className="text-sm font-bold text-[#24212B]">{t("layout.nav.search.scenario")}</span>
                <span className="text-xs font-bold text-[#FFFFFF] bg-[#6444E6] px-2 py-0.5 rounded">{t("layout.nav.search.tool")}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
