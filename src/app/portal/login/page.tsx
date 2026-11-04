"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, AlertCircle, RefreshCw, ArrowRight, Eye, EyeOff, ShieldCheck, HeartHandshake, UserCheck } from "lucide-react";

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@hithataidak.lk");
  const [password, setPassword] = useState("AdminSafePassword2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const targetEmail = customEmail || email;
    const targetPass = customPass || password;

    try {
      const res = await fetch("/api/portal/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
        signal: AbortSignal.timeout(15000),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed. Check your credentials.");
      }

      if (data.sessionToken && typeof window !== "undefined") {
        localStorage.setItem("hid_supporter_session", data.sessionToken);
      }

      router.push("/portal");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    handleLogin(undefined, roleEmail, rolePass);
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#EDE7F6]/30 via-[#FAF9F7] to-[#FAF9F7]">
      <div className="max-w-md w-full space-y-7 animate-fadeIn">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#25234A] text-white mx-auto flex items-center justify-center shadow-md">
            <Lock className="w-7 h-7 text-[#B8D8C2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#25234A] tracking-tight">
              Supporter Portal Login
            </h1>
            <p className="text-sm text-[#5B5875] mt-1">
              Hithata Idak Volunteer & Supervisor Management System
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="p-7 sm:p-8 rounded-3xl bg-white border border-[#E8E5DF] shadow-lg space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick 1-Click Access Buttons */}
          <div className="space-y-2 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5B5875] block">
              1-Click Instant Sign-In:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin("admin@hithataidak.lk", "AdminSafePassword2026!")}
                className="p-2.5 rounded-xl border border-[#D4C7E8] bg-[#F6F3FA] hover:bg-[#EDE7F6] text-xs font-bold text-[#25234A] flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-[#25234A]" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin("supporter@hithataidak.lk", "SupporterSafePassword2026!")}
                className="p-2.5 rounded-xl border border-[#B8D8C2] bg-[#E4F1E9]/60 hover:bg-[#E4F1E9] text-xs font-bold text-[#25234A] flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
              >
                <HeartHandshake className="w-4 h-4 text-[#336142]" />
                <span>Supporter</span>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin("supervisor@hithataidak.lk", "SupervisorSafePassword2026!")}
                className="p-2.5 rounded-xl border border-[#E9F2FA] bg-[#F3F8FC] hover:bg-[#E9F2FA] text-xs font-bold text-[#25234A] flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4 text-[#2B6187]" />
                <span>Supervisor</span>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#E8E5DF]"></div>
            <span className="flex-shrink mx-3 text-xs font-semibold text-[#8B889F] uppercase tracking-wider">or sign in manually</span>
            <div className="flex-grow border-t border-[#E8E5DF]"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="supporter-email" className="block text-xs font-bold uppercase tracking-wider text-[#25234A] mb-1.5">
                Email Address or Username
              </label>
              <input
                type="text"
                id="supporter-email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hithataidak.lk or 'admin'"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DF] text-sm focus:border-[#25234A] focus:ring-1 focus:ring-[#25234A] outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="supporter-password" className="block text-xs font-bold uppercase tracking-wider text-[#25234A]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-[#5B5875] hover:text-[#25234A] flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? "Hide" : "Show"}</span>
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="supporter-password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="AdminSafePassword2026! or 'admin123'"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DF] text-sm focus:border-[#25234A] focus:ring-1 focus:ring-[#25234A] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-[#25234A] hover:bg-[#383466] shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Supporter Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Credentials Reference Box */}
          <div className="p-3 rounded-xl bg-[#FAF9F7] border border-[#E8E5DF] text-xs text-[#5B5875] space-y-1">
            <span className="font-bold text-[#25234A] block">Available Login Credentials:</span>
            <div className="flex justify-between items-center py-0.5">
              <span><strong>Admin:</strong> <code className="text-[#25234A]">admin@hithataidak.lk</code> (or <code className="text-[#25234A]">admin</code>)</span>
              <span className="text-[#746A83]"><code className="text-[#25234A]">AdminSafePassword2026!</code> or <code className="text-[#25234A]">admin123</code></span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span><strong>Supporter:</strong> <code className="text-[#25234A]">supporter@hithataidak.lk</code> (or <code className="text-[#25234A]">supporter</code>)</span>
              <span className="text-[#746A83]"><code className="text-[#25234A]">SupporterSafePassword2026!</code> or <code className="text-[#25234A]">supporter123</code></span>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/" className="text-sm text-[#5B5875] hover:text-[#25234A]">
            ← Return to public website
          </Link>
        </div>
      </div>
    </div>
  );
}
