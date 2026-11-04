"use client";

import { useEffect, useCallback } from "react";
import { ShieldAlert } from "lucide-react";

interface QuickExitButtonProps {
  className?: string;
}

export function QuickExitButton({ className = "" }: QuickExitButtonProps) {
  const triggerSafeExit = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        // Clear all visitor and sensitive local storage
        localStorage.removeItem("hid_visitor_session");
        localStorage.removeItem("hid_ticket_ref");
        sessionStorage.clear();
        // Replace location immediately to prevent browser Back button recovery
        window.location.replace("https://www.google.com");
      }
    } catch {
      window.location.href = "https://www.google.com";
    }
  }, []);

  // Listen to Escape key globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        triggerSafeExit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [triggerSafeExit]);

  return (
    <button
      type="button"
      onClick={triggerSafeExit}
      title="Quick Exit (Esc) - Leaves immediately and opens Google"
      className={`px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 hover:bg-rose-100 hover:text-rose-900 border border-rose-200 flex items-center gap-1.5 transition-colors shadow-2xs ${className}`}
    >
      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
      <span>Safe Exit</span>
      <kbd className="hidden sm:inline-block px-1 py-0.2 bg-white/80 border border-rose-300 rounded text-[10px] font-mono text-rose-700">
        ESC
      </kbd>
    </button>
  );
}

