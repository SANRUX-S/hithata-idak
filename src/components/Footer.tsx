import Link from "next/link";
import { ExternalLink, HeartHandshake, Lock, Phone, ShieldCheck } from "lucide-react";
import { officialDonationUrl } from "@/lib/donations";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Start a conversation" },
  { href: "/story", label: "Our story" },
  { href: "/safety", label: "Safety & privacy" },
  { href: "/resources", label: "Help & resources" },
  { href: "/donate", label: "Donate with kindness" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#443A6C] bg-[#30284F] px-5 pb-6 pt-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 border-b border-white/15 pb-7 md:flex-row md:items-center md:gap-10">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#E5D9F2]">
              <ShieldCheck className="h-5 w-5 shrink-0" strokeWidth={1.6} />
              Support Boundaries & Emergency Notice
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#E1DCEB]">
              Hithata Idak offers emotional listening and peer support. It is not a clinical therapy service, medical consultation, or emergency responder. For immediate crisis support in Sri Lanka, call 1926.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#D4C6E4]">Sri Lanka crisis helpline</span>
            <a href="tel:1926" className="inline-flex items-center gap-2 rounded-xl bg-[#FAF7FD] px-5 py-3 text-sm font-bold text-[#3B2E5A] transition-colors hover:bg-[#EDE3F5]">
              <Phone className="h-4 w-4" /> 1926 (Free, 24/7)
            </a>
            <a href="https://nimh.health.gov.lk" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[#D6CBE2] hover:text-white hover:underline">
              National Institute of Mental Health <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="grid gap-7 py-7 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr] lg:gap-10">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 rounded-lg">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10"><HeartHandshake className="h-5 w-5 text-[#DECEEE]" strokeWidth={1.5} /></span>
              <span><span className="block text-sm font-bold tracking-tight">Hithata Idak</span><span lang="si" className="block text-[10px] text-[#C8B8D9]">හිතට ඉඩක්</span></span>
            </Link>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-[#D6CBE2]">A little space to breathe. A caring person to listen. Always free, always at your pace.</p>
          </div>

          <nav aria-label="Footer navigation">
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#C9B4DD]">Find your way</h2>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-[#E1D8EB] sm:grid-cols-1">
              {footerLinks.map((link) => (
                <li key={link.href}><Link href={link.href} className="hover:text-white hover:underline">{link.label}</Link></li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#C9B4DD]">In your own words</h2>
            <p className="text-xs leading-relaxed text-[#E1D8EB]"><span lang="si">සිංහල</span> · English · Singlish</p>
            <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-[#CFC1DD]"><Lock className="mt-0.5 h-3 w-3 shrink-0" />Private conversations.<br />No account needed.</p>
            <a href={officialDonationUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block text-[11px] leading-relaxed text-[#DCCCE9] hover:text-white hover:underline">Donations go directly to Apeksha Hospital. We keep none. <ExternalLink className="mb-0.5 inline h-3 w-3" /></a>
          </div>

          <div>
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#C9B4DD]">A community of kindness</h2>
            <Link href="/portal/login" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-[#E6DBEF] transition-colors hover:bg-white/10"><Lock className="h-3.5 w-3.5" />Supporter portal</Link>
            <Link href="/story#volunteer" className="mt-3 block text-xs text-[#DCC5E8] hover:text-white hover:underline">Become a volunteer →</Link>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-white/10 pt-5 text-[10px] leading-relaxed text-[#C4B5D3] sm:flex-row sm:items-center">
          <p>© 2026 Hithata Idak. Built with compassion, privacy, and trust.</p>
          <Link href="/safety" className="hover:text-white hover:underline">Privacy disclosures</Link>
        </div>
      </div>
    </footer>
  );
}
