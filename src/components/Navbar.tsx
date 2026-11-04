"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartHandshake, Menu, X, Heart, ShieldCheck } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" }, { href: "/chat", label: "Start Chat" },
  { href: "/story", label: "Our Story" }, { href: "/safety", label: "Safety & Privacy" },
  { href: "/resources", label: "Help & Resources" }, { href: "/donate", label: "Donate" },
];
type Availability = { status: "available" | "busy" | "offline"; operatingHours: string; pilotMode: boolean };

export function Navbar() {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const mobileMenuOpen = menuPath === pathname;

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function checkAvailability() {
      try {
        const response = await fetch("/api/availability", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) });
        if (!response.ok) throw new Error("Unavailable");
        const data: Availability = await response.json();
        if (!controller.signal.aborted) setAvailability(data);
      } catch {
        if (!controller.signal.aborted) setAvailability(null);
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(checkAvailability, 30000);
      }
    }
    void checkAvailability();
    return () => { controller.abort(); clearTimeout(timer); };
  }, []);

  const statusLabel = !availability ? "Checking availability" : availability.status === "available" ? "Supporters available" : availability.status === "busy" ? "Supporters are busy" : "Leave a message";
  return <>
    <div className="crisis-banner">
      <div className="home-container crisis-banner-inner"><p><span className="crisis-dot" /> Need urgent support? Sri Lanka National Mental Health Helpline <a href="tel:1926">1926</a> <span className="hidden sm:inline">(Free, 24/7)</span></p>{availability?.pilotMode && <span className="pilot-badge"><ShieldCheck size={11} /> Community pilot</span>}</div>
    </div>
    <header className="site-header">
      <div className="home-container nav-inner">
        <Link href="/" className="nav-brand" aria-label="Hithata Idak home"><span className="brand-mark"><HeartHandshake size={25} strokeWidth={1.6} /></span><span><span className="brand-name">Hithata Idak <span className="brand-sinhala font-sinhala">හිතට ඉඩක්</span></span><span className="brand-tagline">A safe place to talk</span></span></Link>
        <nav className="desktop-nav" aria-label="Main navigation">{navLinks.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className={`${pathname === link.href ? "nav-active" : ""} ${link.href === "/donate" ? "nav-donate" : ""}`}>{link.label}{link.href === "/donate" && <Heart size={12} />}</Link>)}</nav>
        <div className="nav-actions"><span className="nav-status" title={availability?.operatingHours}><span className={`status-dot ${availability?.status === "available" ? "status-online" : availability?.status === "busy" ? "status-busy" : ""}`} />{statusLabel}</span><Link href="/chat" className="nav-talk">Let’s talk <span aria-hidden="true">↗</span></Link></div>
        <button type="button" className="mobile-menu-button" onClick={() => setMenuPath(mobileMenuOpen ? null : pathname)} aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation">{mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
      {mobileMenuOpen && <nav id="mobile-navigation" className="mobile-navigation" aria-label="Mobile navigation">{navLinks.map(link => <Link key={link.href} href={link.href} onClick={() => setMenuPath(null)} aria-current={pathname === link.href ? "page" : undefined} className={pathname === link.href ? "nav-active" : ""}>{link.label}{link.href === "/donate" && <Heart size={15} />}</Link>)}<p><span className={`status-dot ${availability?.status === "available" ? "status-online" : ""}`} />{statusLabel}</p></nav>}
    </header>
  </>;
}
