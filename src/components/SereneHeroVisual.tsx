export function SereneHeroVisual() {
  return (
    <div className="relative w-full aspect-16/10 sm:aspect-16/9 max-w-xl mx-auto rounded-3xl overflow-hidden shadow-xl border border-[#D4C7E8]/60 bg-gradient-to-b from-[#E9F2FA] via-[#EDE7F6] to-[#FAF9F7]">
      {/* Gentle Sun / Light Aura */}
      <div className="absolute top-8 right-12 w-32 h-32 rounded-full bg-gradient-to-tr from-[#EACBD5]/70 to-[#FFF3E0] blur-2xl opacity-80" />
      
      {/* SVG Mountain Silhouettes & Peaceful Valley */}
      <svg
        viewBox="0 0 600 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E9F2FA" />
            <stop offset="50%" stopColor="#EDE7F6" />
            <stop offset="100%" stopColor="#FAF9F7" />
          </linearGradient>
          <linearGradient id="mountDist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4C7E8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#EDE7F6" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="mountMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B8D8C2" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#EDE7F6" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="mountFore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#383466" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#25234A" />
          </linearGradient>
        </defs>

        {/* Soft Sunrise Orb */}
        <circle cx="420" cy="110" r="45" fill="#FFF8E7" opacity="0.9" />
        <circle cx="420" cy="110" r="75" fill="#FFE0B2" opacity="0.25" filter="blur(8px)" />

        {/* Distant Sri Lankan Central Highlands */}
        <path
          d="M0 240 Q140 160 280 200 T600 170 L600 360 L0 360 Z"
          fill="url(#mountDist)"
        />

        {/* Mid-range Hills */}
        <path
          d="M0 260 Q180 200 360 250 T600 230 L600 360 L0 360 Z"
          fill="url(#mountMid)"
        />

        {/* Foreground Ridge with Quiet Silhouette */}
        <path
          d="M0 310 Q120 270 240 290 T480 280 Q540 275 600 300 L600 360 L0 360 Z"
          fill="url(#mountFore)"
        />

        {/* Gentle Listening Presence Motif: Two silhouettes under the canopy */}
        <g transform="translate(180, 255) scale(0.65)" opacity="0.95">
          {/* Supporter figure */}
          <circle cx="50" cy="30" r="7" fill="#FAF9F7" />
          <path d="M40 50 C40 40 60 40 60 50 L58 70 L42 70 Z" fill="#FAF9F7" />

          {/* Visitor figure */}
          <circle cx="75" cy="32" r="7" fill="#FAF9F7" />
          <path d="M65 52 C65 42 85 42 85 52 L83 70 L67 70 Z" fill="#FAF9F7" />

          {/* Quiet connecting arch */}
          <path d="M48 42 Q62 36 76 43" stroke="#B8D8C2" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>

      {/* Floating Trust Card Overlay */}
      <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-md flex items-center justify-between gap-3 text-xs sm:text-sm text-[#25234A]">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">Real Human Volunteers</span>
        </div>
        <div className="text-[#5B5875] text-[11px] sm:text-xs">
          Never AI • 100% Free • Anonymous
        </div>
      </div>
    </div>
  );
}

