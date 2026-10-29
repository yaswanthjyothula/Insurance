"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  User as UserIcon,
  Eye,
  EyeOff,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Zap,
  Building2
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAuth, DEMO_USERS } from "@/components/auth/AuthProvider";

type Mode = "signin" | "signup" | "forgot";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard/protection-passport";
  const initialMode = (searchParams.get("mode") as Mode) || "signin";

  const { user, signIn, signUp, signInDemo, signOut } = useAuth();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email) {
      setError("Please enter your email or registered mobile number.");
      setLoading(false);
      return;
    }

    try {
      const res = await signIn(email, password);
      if (res.success) {
        setSuccessNotice("Authentication successful. Redirecting to your Protection Portal...");
        setTimeout(() => {
          router.push(next);
        }, 600);
      } else {
        setError(res.error || "Invalid credentials. Please verify or use Quick Demo Sign In.");
      }
    } catch (err: any) {
      setError(err?.message || "Sign in error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!fullName.trim()) {
      setError("Please provide your full legal name.");
      setLoading(false);
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      setLoading(false);
      return;
    }
    if (!agreeTerms) {
      setError("Please accept the terms and IRDAI privacy consent to continue.");
      setLoading(false);
      return;
    }

    try {
      const res = await signUp({
        email,
        password,
        full_name: fullName,
        phone: phone || "+91 98765 43210",
      });

      if (res.success) {
        setSuccessNotice("Account created successfully! Preparing your financial dashboard...");
        setTimeout(() => {
          router.push(next);
        }, 700);
      } else {
        setError(res.error || "Unable to create account. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (key: "praveen" | "ananya") => {
    setLoading(true);
    setError(null);
    try {
      await signInDemo(key);
      setSuccessNotice(`Welcome, ${DEMO_USERS[key].name}! Entering your live financial dashboard...`);
      setTimeout(() => {
        router.push(next);
      }, 500);
    } catch (err) {
      setError("Demo sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // If already signed in, show authenticated glass profile card
  if (user) {
    return (
      <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-16 overflow-hidden">
        {/* Ambient Glass Glows */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#7957FF]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-[#9A80FF]/25 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-md w-full backdrop-blur-2xl bg-white/80 border border-white/60 rounded-[32px] p-8 sm:p-10 shadow-[0_30px_90px_rgba(121,87,255,0.18)] space-y-6 text-center">
          <Logo className="justify-center mb-2" />
          
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-[#7957FF] to-[#9A80FF] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-[#7957FF]/30">
            {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified Account Active</span>
            </div>
            <h2 className="text-xl font-extrabold text-[#24212B]">
              {user.user_metadata?.full_name || "Valued Client"}
            </h2>
            <p className="text-xs text-[#6F6A7C] font-medium">{user.email}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#D9D3E8] text-xs text-left space-y-1.5">
            <div className="flex justify-between text-[#6F6A7C]">
              <span>Active Status:</span>
              <span className="font-bold text-[#0E9F7E]">Ready for Advisory & Tools</span>
            </div>
            {user.user_metadata?.phone && (
              <div className="flex justify-between text-[#6F6A7C]">
                <span>Registered Mobile:</span>
                <span className="font-bold text-[#24212B]">{user.user_metadata.phone}</span>
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-2">
            <Link
              href={next}
              className="w-full py-3.5 px-5 bg-[#7957FF] hover:bg-[#6444E6] text-white font-bold text-sm rounded-2xl shadow-[0_10px_25px_rgba(121,87,255,0.3)] transition-all flex items-center justify-center gap-2 group"
            >
              <span>Continue to Protection Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              onClick={() => signOut()}
              className="w-full py-3 px-5 bg-white/70 hover:bg-white text-[#D32F2F] font-semibold text-xs rounded-2xl border border-[#D9D3E8] transition-all"
            >
              Sign Out of this Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center px-4 py-16 overflow-hidden">
      {/* Dynamic Glass Ambient Glow Orbs */}
      <div className="absolute top-12 left-1/4 w-[420px] h-[420px] bg-gradient-to-tr from-[#7957FF]/25 to-[#E9E4FF]/40 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[380px] h-[380px] bg-gradient-to-br from-[#9277FF]/20 to-[#6444E6]/15 rounded-full blur-[110px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 max-w-lg w-full backdrop-blur-3xl bg-white/75 border border-white/60 rounded-[32px] p-6 sm:p-10 shadow-[0_35px_100px_rgba(121,87,255,0.18),inset_0_1px_2px_rgba(255,255,255,0.9)] space-y-6">
        
        {/* Header with Logo */}
        <div className="text-center space-y-2">
          <Logo className="justify-center mb-1" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#24212B] tracking-tight">
            {mode === "signin" ? "Sign In to LifeSure AI" : mode === "signup" ? "Create Your Protection Account" : "Reset Account Password"}
          </h1>
          <p className="text-xs text-[#6F6A7C] max-w-sm mx-auto">
            {mode === "signin"
              ? "Access your Protection Passport, saved scenarios, and certified advisory."
              : mode === "signup"
              ? "Join thousands of Indian families planning life cover with 0% sales hype."
              : "Enter your registered email address and we'll dispatch a secure reset key."}
          </p>
        </div>

        {/* Tab Toggle: Sign In vs Sign Up */}
        {mode !== "forgot" && (
          <div className="p-1 rounded-2xl bg-[#F1EDFC]/80 border border-[#D9D3E8]/70 flex items-center">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
                setSuccessNotice(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === "signin"
                  ? "bg-white text-[#7957FF] shadow-[0_2px_10px_rgba(121,87,255,0.15)] border border-white"
                  : "text-[#6F6A7C] hover:text-[#24212B]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
                setSuccessNotice(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === "signup"
                  ? "bg-white text-[#7957FF] shadow-[0_2px_10px_rgba(121,87,255,0.15)] border border-white"
                  : "text-[#6F6A7C] hover:text-[#24212B]"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* 1-Click Instant Demo Access Box */}
        {mode === "signin" && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#F7F5FF] to-[#EFEAFF] border border-[#7957FF]/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#7957FF] uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 fill-[#7957FF]" />
                Instant Demo Access
              </span>
              <span className="text-[10px] text-[#6F6A7C]">No password needed</span>
            </div>
            <p className="text-[11px] text-[#4A4553] leading-relaxed">
              Experience the platform as <strong>Praveen Sharma</strong> (Senior Tech Lead, ₹18L/yr income, 2 dependents).
            </p>
            <button
              type="button"
              onClick={() => handleDemoSignIn("praveen")}
              disabled={loading}
              className="w-full py-2.5 px-3 bg-white hover:bg-[#7957FF] text-[#7957FF] hover:text-white font-bold text-xs rounded-xl border border-[#7957FF]/40 shadow-sm transition-all flex items-center justify-center gap-2 group"
            >
              <span>⚡ One-Click Instant Sign In</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span className="font-bold">{successNotice}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={mode === "signin" ? handleSignIn : mode === "signup" ? handleSignUp : handleSignIn} className="space-y-4 text-xs">
          
          {/* Sign Up Fields: Full Name & Phone */}
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#24212B] mb-1.5" htmlFor="full_name">
                  Full Legal Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#6F6A7C] absolute left-3.5 top-3.5" />
                  <input
                    id="full_name"
                    type="text"
                    placeholder="e.g. Praveen Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 border border-[#D9D3E8] text-[#24212B] placeholder:text-[#A59FB5] focus:outline-none focus:border-[#7957FF] focus:ring-2 focus:ring-[#7957FF]/20 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#24212B] mb-1.5" htmlFor="phone">
                  Mobile Number (for e-KYC & Verification)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#6F6A7C] absolute left-3.5 top-3.5" />
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 border border-[#D9D3E8] text-[#24212B] placeholder:text-[#A59FB5] focus:outline-none focus:border-[#7957FF] focus:ring-2 focus:ring-[#7957FF]/20 transition-all font-medium"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-[#24212B] mb-1.5" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6F6A7C] absolute left-3.5 top-3.5" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 border border-[#D9D3E8] text-[#24212B] placeholder:text-[#A59FB5] focus:outline-none focus:border-[#7957FF] focus:ring-2 focus:ring-[#7957FF]/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Password (for signin and signup) */}
          {mode !== "forgot" && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[#24212B]" htmlFor="password">
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError(null);
                      setSuccessNotice(null);
                    }}
                    className="text-[11px] font-bold text-[#7957FF] hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6F6A7C] absolute left-3.5 top-3.5" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder={mode === "signup" ? "Create a strong password (min 6 characters)" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/90 border border-[#D9D3E8] text-[#24212B] placeholder:text-[#A59FB5] focus:outline-none focus:border-[#7957FF] focus:ring-2 focus:ring-[#7957FF]/20 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#6F6A7C] hover:text-[#24212B]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password (signup only) */}
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-bold text-[#24212B] mb-1.5" htmlFor="confirm_password">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6F6A7C] absolute left-3.5 top-3.5" />
                <input
                  id="confirm_password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 border border-[#D9D3E8] text-[#24212B] placeholder:text-[#A59FB5] focus:outline-none focus:border-[#7957FF] focus:ring-2 focus:ring-[#7957FF]/20 transition-all font-medium"
                />
              </div>
            </div>
          )}

          {/* Options: Remember me & Terms */}
          {mode === "signin" && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#4A4553]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-[#7957FF] rounded"
                />
                <span>Remember me on this device</span>
              </label>
            </div>
          )}

          {mode === "signup" && (
            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer text-[11px] text-[#4A4553] leading-relaxed">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 accent-[#7957FF] rounded mt-0.5"
                />
                <span>
                  I agree to the <Link href="/terms-and-conditions" className="text-[#7957FF] font-bold hover:underline">Terms of Service</Link>, <Link href="/privacy-policy" className="text-[#7957FF] font-bold hover:underline">Privacy Policy</Link>, and consent to fiduciary underwriting disclosures under IRDAI guidelines.
                </span>
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 text-sm font-bold text-white bg-[#7957FF] hover:bg-[#6444E6] disabled:opacity-60 rounded-2xl shadow-[0_12px_28px_rgba(121,87,255,0.32)] hover:shadow-[0_16px_36px_rgba(121,87,255,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </span>
            ) : (
              <>
                <span>
                  {mode === "signin" ? "Sign In to Protection Portal" : mode === "signup" ? "Create Free Account" : "Send Password Reset Link"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Mode switch footers */}
        <div className="pt-2 border-t border-[#D9D3E8]/70 text-center text-xs text-[#6F6A7C] space-y-2">
          {mode === "signin" ? (
            <p>
              Don&apos;t have an account yet?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setSuccessNotice(null);
                }}
                className="font-bold text-[#7957FF] hover:underline"
              >
                Create Account for free
              </button>
            </p>
          ) : mode === "signup" ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setSuccessNotice(null);
                }}
                className="font-bold text-[#7957FF] hover:underline"
              >
                Sign In here
              </button>
            </p>
          ) : (
            <p>
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setSuccessNotice(null);
                }}
                className="font-bold text-[#7957FF] hover:underline"
              >
                Back to Sign In
              </button>
            </p>
          )}

          <div className="flex items-center justify-center gap-4 text-[10px] text-[#A59FB5] pt-2">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#0E9F7E]" /> 256-bit SSL Protection
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#7957FF]" /> IRDAI Sourced Framework
            </span>
            <span>•</span>
            <span>Zero Spam Calls</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center text-sm text-[#6F6A7C]">
        Loading LifeSure authentication...
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
