import Link from "next/link";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Start a conversation" },
  { href: "/story", label: "Our story" },
  { href: "/safety", label: "Safety & privacy" },
  { href: "/resources", label: "Help & resources" },
  { href: "/donate", label: "Support Hithata Idak" },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-[#3c3654] px-5 pb-6 pt-8 text-[#f5f3f7] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 border-b border-white/15 pb-7 md:flex-row md:items-center md:gap-10">
          <div className="max-w-3xl">
            <p className="text-base font-medium">Support boundaries & emergency notice</p>
            <p className="mt-3 text-base leading-relaxed text-[#e1dde8]">
              Hithata Idak offers emotional listening and peer support. It is not a clinical therapy service, medical consultation, or emergency responder. For immediate crisis support in Sri Lanka, call 1926.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
            <span className="text-sm text-[#d5dcca]">Sri Lanka crisis helpline</span>
            <a href="tel:1926" className="inline-flex rounded-lg bg-[#FAF9F7] px-5 py-3 text-base font-semibold text-[#3c3654] transition-colors hover:bg-[#e7ebe2]">1926 (Free, 24/7)</a>
            <a href="https://nimh.health.gov.lk" target="_blank" rel="noopener noreferrer" className="text-sm text-[#e1dde8] underline-offset-4 hover:text-white hover:underline">National Institute of Mental Health</a>
          </div>
        </div>

        <div className="grid gap-7 py-7 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr] lg:gap-10">
          <div>
            <Link href="/" className="inline-block">
              <span className="block text-xl font-semibold tracking-tight">Hithata Idak</span>
              <span lang="si" className="mt-1 block text-sm text-[#d5dcca]">හිතට ඉඩක්</span>
            </Link>
            <p className="mt-3 max-w-xs text-base leading-relaxed text-[#e1dde8]">A little space to breathe. A caring person to listen. Free, and at your pace.</p>
          </div>

          <nav aria-label="Footer navigation">
            <h2 className="mb-3 text-base font-medium text-[#d5dcca]">Find your way</h2>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-base text-[#e1dde8] sm:grid-cols-1">
              {footerLinks.map((link) => (
                <li key={link.href}><Link href={link.href} className="hover:text-white hover:underline">{link.label}</Link></li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="mb-3 text-base font-medium text-[#d5dcca]">In your own words</h2>
            <p className="text-base leading-relaxed text-[#e1dde8]"><span lang="si">සිංහල</span> · English · Singlish</p>
            <p className="mt-3 text-base leading-relaxed text-[#e1dde8]">Private conversations.<br />No account needed.</p>
            <Link href="/donate" className="mt-3 block text-base leading-relaxed text-[#e1dde8] underline decoration-white/40 underline-offset-4 hover:text-white">If you would like to support our work, find out about donating.</Link>
          </div>

          <div>
            <h2 className="mb-3 text-base font-medium text-[#d5dcca]">A community of kindness</h2>
            <Link href="/portal/login" className="inline-block rounded-lg border border-white/30 px-3 py-2 text-base transition-colors hover:bg-white/10">Supporter portal</Link>
            <Link href="/story#volunteer" className="mt-3 block text-base text-[#e1dde8] hover:text-white hover:underline">Become a volunteer</Link>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-white/15 pt-5 text-sm leading-relaxed text-[#d2ccdc] sm:flex-row sm:items-center">
          <p>© 2026 Hithata Idak. Built with compassion, privacy, and trust.</p>
          <Link href="/safety" className="hover:text-white hover:underline">Privacy disclosures</Link>
        </div>
      </div>
    </footer>
  );
}
