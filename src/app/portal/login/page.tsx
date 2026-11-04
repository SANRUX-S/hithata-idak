"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, AlertCircle, RefreshCw, ArrowRight } from "lucide-react";

export default function PortalLoginPage() {
  const router = useRouter();
  const isDevelopment = process.env.NODE_ENV !== "production";
  const [email, setEmail] = useState(isDevelopment ? "supporter@hithataidak.lk" : "");
  const [password, setPassword] = useState(isDevelopment ? "SupporterSafePassword2026!" : "");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/portal/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed. Check your credentials.");
      }

      router.push("/portal");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication error.");
    } finally {
      setIsLoading(false);
    }
  };

  const setPreset = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#EDE7F6]/30 via-[#FAF9F7] to-[#FAF9F7]">
      <div className="max-w-md w-full space-y-8 animate-fadeIn">
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
              Hithata Idak Human Volunteer & Supervisor Management System
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

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="supporter-email" className="block text-sm font-bold uppercase tracking-wider text-[#25234A] mb-1.5">
                Volunteer Email Address
              </label>
              <input
                type="email"
                id="supporter-email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="supporter@hithataidak.lk"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DF] text-sm focus:border-[#25234A] focus:ring-1 focus:ring-[#25234A]"
              />
            </div>

            <div>
              <label htmlFor="supporter-password" className="block text-sm font-bold uppercase tracking-wider text-[#25234A] mb-1.5">
                Password
              </label>
              <input
                type="password"
                id="supporter-password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DF] text-sm focus:border-[#25234A] focus:ring-1 focus:ring-[#25234A]"
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

          {/* Quick Preset Selector for Testing/Reviewing */}
          {isDevelopment && <div className="pt-4 border-t border-[#E8E5DF] space-y-2">
            <span className="text-sm font-bold uppercase tracking-wider text-[#5B5875] block text-center">
              Testing Account Shortcuts:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPreset("supporter@hithataidak.lk", "SupporterSafePassword2026!")}
                className="px-2 py-1.5 rounded-lg border border-[#E8E5DF] hover:bg-[#EDE7F6] text-sm font-medium text-[#25234A] text-center"
              >
                Volunteer
              </button>
              <button
                type="button"
                onClick={() => setPreset("supervisor@hithataidak.lk", "SupervisorSafePassword2026!")}
                className="px-2 py-1.5 rounded-lg border border-[#E8E5DF] hover:bg-[#EDE7F6] text-sm font-medium text-[#25234A] text-center"
              >
                Supervisor
              </button>
              <button
                type="button"
                onClick={() => setPreset("admin@hithataidak.lk", "AdminSafePassword2026!")}
                className="px-2 py-1.5 rounded-lg border border-[#E8E5DF] hover:bg-[#EDE7F6] text-sm font-medium text-[#25234A] text-center"
              >
                Admin
              </button>
            </div>
          </div>}
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

