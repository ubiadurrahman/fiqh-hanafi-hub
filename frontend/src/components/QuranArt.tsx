/**
 * Open mushaf illustration. Colours come from CSS variables so the same
 * drawing matches the light and dark themes.
 */
export default function QuranArt({ className = "" }: { className?: string }) {
  return (
    <div className={`quran-stage ${className}`}>
      <div className="quran-glow" aria-hidden />
      <svg className="quran-book" viewBox="0 0 560 420" role="img" aria-label="An open copy of the Quran">
        <defs>
          <linearGradient id="q-cover" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--q-cover-light)" />
            <stop offset="100%" stopColor="var(--q-cover)" />
          </linearGradient>
          <linearGradient id="q-page" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--q-page-light)" />
            <stop offset="100%" stopColor="var(--q-page)" />
          </linearGradient>
          <linearGradient id="q-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--q-gold-light)" />
            <stop offset="50%" stopColor="var(--q-gold)" />
            <stop offset="100%" stopColor="var(--q-gold-deep)" />
          </linearGradient>
          <filter id="q-shadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="18" stdDeviation="14" floodColor="#022c22" floodOpacity="0.35" />
          </filter>
        </defs>

        <ellipse cx="280" cy="372" rx="190" ry="18" fill="var(--q-shadow)" opacity="0.45" />

        <g filter="url(#q-shadow)">
          <path d="M36 78 C36 58 52 46 74 46 H248 C268 46 278 62 280 86 V348 C278 326 268 314 248 314 H74 C52 314 36 328 36 348 Z" fill="url(#q-cover)" />
          <path d="M524 78 C524 58 508 46 486 46 H312 C292 46 282 62 280 86 V348 C282 326 292 314 312 314 H486 C508 314 524 328 524 348 Z" fill="url(#q-cover)" />

          <path d="M58 70 C58 56 70 48 86 48 H246 C262 48 270 60 272 78 V332 C270 316 262 308 246 308 H86 C70 308 58 318 58 332 Z" fill="url(#q-page)" />
          <path d="M502 70 C502 56 490 48 474 48 H314 C298 48 290 60 288 78 V332 C290 316 298 308 314 308 H474 C490 308 502 318 502 332 Z" fill="url(#q-page)" />

          <path d="M272 78 C274 96 278 150 280 190 C282 230 278 286 272 332" fill="none" stroke="var(--q-gutter)" strokeWidth="8" strokeLinecap="round" />
          <path d="M288 78 C286 96 282 150 280 190 C278 230 282 286 288 332" fill="none" stroke="var(--q-gutter)" strokeWidth="8" strokeLinecap="round" />
        </g>

        <g fill="none" stroke="url(#q-gold)" strokeWidth="1.6">
          <rect x="74" y="64" width="182" height="228" rx="6" />
          <rect x="304" y="64" width="182" height="228" rx="6" />
          <rect x="82" y="72" width="166" height="212" rx="4" strokeWidth="0.6" opacity="0.7" />
          <rect x="312" y="72" width="166" height="212" rx="4" strokeWidth="0.6" opacity="0.7" />
        </g>

        <g fill="url(#q-gold)">
          <path d="M90 80 h10 v3 h-7 v7 h-3 z" />
          <path d="M470 80 h-10 v3 h7 v7 h3 z" />
          <path d="M90 276 h10 v-3 h-7 v-7 h-3 z" />
          <path d="M470 276 h-10 v-3 h7 v-7 h3 z" />
        </g>

        <g opacity="0.55" stroke="var(--q-line)" strokeWidth="1.2" strokeLinecap="round">
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`l-${i}`} x1="98" x2={i % 2 ? 228 : 214} y1={168 + i * 14} y2={168 + i * 14} />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={`r-${i}`} x1="332" x2={i % 2 ? 462 : 448} y1={168 + i * 16} y2={168 + i * 16} />
          ))}
        </g>

        <circle cx="280" cy="168" r="34" fill="var(--q-page)" stroke="url(#q-gold)" strokeWidth="2" />
        <circle cx="280" cy="168" r="26" fill="none" stroke="url(#q-gold)" strokeWidth="0.8" />
        <path
          d="M280 146 L286 162 H303 L289 172 L294 188 L280 178 L266 188 L271 172 L257 162 H274 Z"
          fill="url(#q-gold)"
        />

        <text
          x="393"
          y="112"
          textAnchor="middle"
          fill="var(--q-ink)"
          fontFamily='"Amiri Quran", "Amiri", serif'
          fontSize="20"
        >
          بِسْمِ اللَّهِ
        </text>
        <text
          x="393"
          y="138"
          textAnchor="middle"
          fill="var(--q-ink)"
          fontFamily='"Amiri Quran", "Amiri", serif'
          fontSize="16"
        >
          الرَّحْمَٰنِ الرَّحِيمِ
        </text>

        <text
          x="164"
          y="118"
          textAnchor="middle"
          fill="var(--q-ink)"
          fontFamily='"Amiri Quran", "Amiri", serif'
          fontSize="20"
        >
          القرآن الكريم
        </text>
        <rect x="108" y="132" width="112" height="22" rx="11" fill="none" stroke="url(#q-gold)" strokeWidth="1" />
        <text x="164" y="148" textAnchor="middle" fill="var(--q-gold-deep)" fontFamily="Inter, sans-serif" fontSize="11" letterSpacing="1.2">
          114
        </text>

        <path d="M248 48 C252 20 268 8 280 8 C292 8 308 20 312 48 L300 64 H260 Z" fill="url(#q-gold)" />
        <circle cx="280" cy="28" r="6" fill="var(--q-page)" />
      </svg>
    </div>
  );
}
