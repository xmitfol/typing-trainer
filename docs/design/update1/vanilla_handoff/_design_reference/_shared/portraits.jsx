// portraits.jsx — Character portraits as SVG illustrations
// All portraits use a 64×64 viewBox with a circular frame.
// Pass `size` to scale, `frame` to control circular background visibility.

function PortraitFrame({ size = 64, bg = '#fef3f0', children, ring }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block' }}>
      <defs>
        <clipPath id={`pc-${bg.replace('#','')}`}>
          <circle cx="32" cy="32" r="30" />
        </clipPath>
      </defs>
      {ring && <circle cx="32" cy="32" r="31" fill="none" stroke={ring} strokeWidth="2" />}
      <circle cx="32" cy="32" r="30" fill={bg} />
      <g clipPath={`url(#pc-${bg.replace('#','')})`}>
        {children}
      </g>
    </svg>
  );
}

// ─── Skin & hair palettes ─────────────────────────────────────────────────
const SKIN = '#f5cba6';
const SKIN_SHADOW = '#e8b58a';
const SKIN_KID = '#fcd9b8';
const SMILE = '#1a1a17';
const CHEEK = '#ff9b9b';

// ─── User portraits ───────────────────────────────────────────────────────

function PAdultMan({ size }) {
  return (
    <PortraitFrame size={size} bg="#dbeafe">
      {/* Neck */}
      <rect x="27" y="38" width="10" height="8" fill={SKIN} />
      {/* Shirt */}
      <path d="M10 64 Q10 48 32 48 Q54 48 54 64 Z" fill="#3b82f6" />
      <path d="M28 47 L32 52 L36 47 L36 55 L28 55 Z" fill="#fff" />
      {/* Face */}
      <ellipse cx="32" cy="28" rx="13" ry="14" fill={SKIN} />
      {/* Hair */}
      <path d="M19 24 Q19 13 32 13 Q45 13 45 24 L45 22 Q41 18 32 18 Q23 18 19 22 Z" fill="#3e2723" />
      {/* Sideburns hint */}
      <path d="M19 26 L19 32 L21 32 L21 26 Z" fill="#3e2723" opacity="0.7" />
      <path d="M43 26 L43 32 L45 32 L45 26 Z" fill="#3e2723" opacity="0.7" />
      {/* Eyes */}
      <circle cx="27" cy="29" r="1.4" fill={SMILE} />
      <circle cx="37" cy="29" r="1.4" fill={SMILE} />
      {/* Eyebrows */}
      <rect x="24" y="25" width="6" height="1.4" rx="0.7" fill="#3e2723" />
      <rect x="34" y="25" width="6" height="1.4" rx="0.7" fill="#3e2723" />
      {/* Mouth */}
      <path d="M28 34 Q32 37 36 34" stroke={SMILE} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Cheek tone */}
      <ellipse cx="22" cy="32" rx="2" ry="1.5" fill={CHEEK} opacity="0.4" />
      <ellipse cx="42" cy="32" rx="2" ry="1.5" fill={CHEEK} opacity="0.4" />
    </PortraitFrame>
  );
}

function PAdultWoman({ size }) {
  return (
    <PortraitFrame size={size} bg="#fce7f3">
      <rect x="28" y="38" width="8" height="8" fill={SKIN} />
      {/* Shirt — cardigan */}
      <path d="M10 64 Q10 48 32 48 Q54 48 54 64 Z" fill="#ec4899" />
      <path d="M28 47 L32 53 L36 47 L36 55 L28 55 Z" fill="#fff" />
      {/* Hair behind */}
      <path d="M15 30 Q12 16 32 14 Q52 16 49 30 L49 52 Q42 44 32 44 Q22 44 15 52 Z" fill="#d4a574" />
      {/* Face */}
      <ellipse cx="32" cy="29" rx="12.5" ry="13.5" fill={SKIN} />
      {/* Bangs */}
      <path d="M20 22 Q25 16 32 16 Q39 16 44 22 Q40 21 32 22 Q24 23 20 22 Z" fill="#d4a574" />
      {/* Hair side wisps */}
      <path d="M19 22 Q17 30 19 38 L17 38 L17 24 Z" fill="#d4a574" />
      <path d="M45 22 Q47 30 45 38 L47 38 L47 24 Z" fill="#d4a574" />
      {/* Eyes */}
      <ellipse cx="27" cy="30" rx="1.4" ry="1.6" fill={SMILE} />
      <ellipse cx="37" cy="30" rx="1.4" ry="1.6" fill={SMILE} />
      {/* Eyelashes */}
      <path d="M25 28.5 L24 27.5 M27 28 L27 27 M29 28.5 L30 27.5" stroke={SMILE} strokeWidth="0.6" strokeLinecap="round" />
      <path d="M35 28.5 L34 27.5 M37 28 L37 27 M39 28.5 L40 27.5" stroke={SMILE} strokeWidth="0.6" strokeLinecap="round" />
      {/* Eyebrows */}
      <path d="M24 25.5 Q27 24.5 30 25.5" stroke="#a47148" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M34 25.5 Q37 24.5 40 25.5" stroke="#a47148" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* Mouth */}
      <path d="M28 35 Q32 38 36 35" stroke="#c2185b" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Cheek */}
      <ellipse cx="22" cy="33" rx="2" ry="1.5" fill={CHEEK} opacity="0.5" />
      <ellipse cx="42" cy="33" rx="2" ry="1.5" fill={CHEEK} opacity="0.5" />
    </PortraitFrame>
  );
}

function PTeenBoy({ size }) {
  return (
    <PortraitFrame size={size} bg="#d1fae5">
      <rect x="27" y="38" width="10" height="8" fill={SKIN} />
      {/* T-shirt — hoodie */}
      <path d="M10 64 Q10 48 32 48 Q54 48 54 64 Z" fill="#10b981" />
      {/* Hood ring */}
      <path d="M16 50 Q32 42 48 50" stroke="#059669" strokeWidth="1.5" fill="none" />
      {/* Face */}
      <ellipse cx="32" cy="28" rx="13" ry="14" fill={SKIN} />
      {/* Messy hair */}
      <path d="M18 22 Q19 11 32 11 Q45 11 46 22 Q44 18 40 17 L37 14 L34 18 L30 13 L26 19 L22 16 L20 22 Z" fill="#1f2937" />
      {/* Eyes */}
      <circle cx="27" cy="29" r="1.5" fill={SMILE} />
      <circle cx="37" cy="29" r="1.5" fill={SMILE} />
      {/* Eyebrows — playful arch */}
      <path d="M24 26 Q27 25 30 26" stroke="#1f2937" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M34 26 Q37 25 40 26" stroke="#1f2937" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      {/* Smirk */}
      <path d="M27 35 Q32 38 37 34" stroke={SMILE} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Headphones */}
      <path d="M16 25 Q16 13 32 13 Q48 13 48 25" stroke="#1a1a17" strokeWidth="2" fill="none" />
      <rect x="14" y="24" width="5" height="9" rx="2" fill="#1a1a17" />
      <rect x="45" y="24" width="5" height="9" rx="2" fill="#1a1a17" />
      <circle cx="16.5" cy="28.5" r="1.5" fill="#10b981" />
      <circle cx="47.5" cy="28.5" r="1.5" fill="#10b981" />
    </PortraitFrame>
  );
}

function PTeenGirl({ size }) {
  return (
    <PortraitFrame size={size} bg="#ede9fe">
      <rect x="28" y="38" width="8" height="8" fill={SKIN} />
      {/* T-shirt */}
      <path d="M10 64 Q10 48 32 48 Q54 48 54 64 Z" fill="#8b5cf6" />
      <text x="32" y="58" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="6" fill="#fff" fontWeight="700">Ё</text>
      {/* Hair back */}
      <path d="M17 30 Q14 14 32 13 Q50 14 47 30 L47 50 Q40 42 32 42 Q24 42 17 50 Z" fill="#d97706" />
      {/* Face */}
      <ellipse cx="32" cy="29" rx="12.5" ry="13.5" fill={SKIN} />
      {/* Side ponytails */}
      <ellipse cx="15" cy="28" rx="4" ry="9" fill="#d97706" transform="rotate(-15 15 28)" />
      <ellipse cx="49" cy="28" rx="4" ry="9" fill="#d97706" transform="rotate(15 49 28)" />
      <circle cx="15" cy="20" r="2" fill="#ef4444" />
      <circle cx="49" cy="20" r="2" fill="#ef4444" />
      {/* Bangs */}
      <path d="M21 21 Q26 17 32 18 Q38 17 43 21 Q39 22 32 23 Q25 22 21 21 Z" fill="#d97706" />
      {/* Eyes */}
      <ellipse cx="27" cy="30" rx="1.4" ry="1.7" fill={SMILE} />
      <ellipse cx="37" cy="30" rx="1.4" ry="1.7" fill={SMILE} />
      <path d="M25 28.5 L24 27.5 M29 28.5 L30 27.5" stroke={SMILE} strokeWidth="0.6" strokeLinecap="round" />
      <path d="M35 28.5 L34 27.5 M39 28.5 L40 27.5" stroke={SMILE} strokeWidth="0.6" strokeLinecap="round" />
      {/* Eyebrows */}
      <path d="M24 26 Q27 25.5 30 26" stroke="#8b4513" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M34 26 Q37 25.5 40 26" stroke="#8b4513" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* Mouth */}
      <path d="M28 35 Q32 38 36 35" stroke="#c2185b" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <ellipse cx="22" cy="33" rx="2" ry="1.5" fill={CHEEK} opacity="0.5" />
      <ellipse cx="42" cy="33" rx="2" ry="1.5" fill={CHEEK} opacity="0.5" />
    </PortraitFrame>
  );
}

function PKidBoy({ size }) {
  return (
    <PortraitFrame size={size} bg="#fef3c7">
      <rect x="27" y="40" width="10" height="6" fill={SKIN_KID} />
      {/* Striped shirt */}
      <path d="M10 64 Q10 48 32 48 Q54 48 54 64 Z" fill="#f59e0b" />
      <rect x="10" y="50" width="44" height="3" fill="#fff" opacity="0.7" />
      <rect x="10" y="56" width="44" height="3" fill="#fff" opacity="0.7" />
      {/* Face — larger head proportion */}
      <ellipse cx="32" cy="30" rx="14" ry="15" fill={SKIN_KID} />
      {/* Spiky hair */}
      <path d="M18 20 L20 14 L22 19 L25 12 L27 18 L30 11 L33 17 L36 12 L39 18 L42 13 L44 19 L46 14 L46 22 Q40 19 32 19 Q24 19 18 22 Z" fill="#92400e" />
      {/* Big eyes */}
      <circle cx="26" cy="31" r="2.2" fill="#fff" />
      <circle cx="26" cy="31.5" r="1.6" fill={SMILE} />
      <circle cx="26.5" cy="30.8" r="0.5" fill="#fff" />
      <circle cx="38" cy="31" r="2.2" fill="#fff" />
      <circle cx="38" cy="31.5" r="1.6" fill={SMILE} />
      <circle cx="38.5" cy="30.8" r="0.5" fill="#fff" />
      {/* Eyebrows happy */}
      <path d="M23 27 Q26 26 29 27" stroke="#92400e" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <path d="M35 27 Q38 26 41 27" stroke="#92400e" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      {/* Big smile */}
      <path d="M25 37 Q32 42 39 37" stroke={SMILE} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Cheeks */}
      <ellipse cx="22" cy="35" rx="2.5" ry="2" fill={CHEEK} opacity="0.6" />
      <ellipse cx="42" cy="35" rx="2.5" ry="2" fill={CHEEK} opacity="0.6" />
    </PortraitFrame>
  );
}

function PKidGirl({ size }) {
  return (
    <PortraitFrame size={size} bg="#fce7f3">
      <rect x="28" y="40" width="8" height="6" fill={SKIN_KID} />
      {/* Top with bow */}
      <path d="M10 64 Q10 48 32 48 Q54 48 54 64 Z" fill="#ec4899" />
      <path d="M27 49 L32 53 L37 49 L36 52 L32 51 L28 52 Z" fill="#fef3c7" />
      {/* Hair main */}
      <path d="M17 32 Q14 16 32 14 Q50 16 47 32 Q45 26 32 26 Q19 26 17 32 Z" fill="#ec4899" />
      {/* Face */}
      <ellipse cx="32" cy="30" rx="13" ry="14" fill={SKIN_KID} />
      {/* Pigtails */}
      <circle cx="14" cy="30" r="6" fill="#92400e" />
      <circle cx="50" cy="30" r="6" fill="#92400e" />
      <circle cx="14" cy="24" r="2" fill="#ec4899" />
      <circle cx="50" cy="24" r="2" fill="#ec4899" />
      {/* Bangs */}
      <path d="M20 23 Q26 19 32 20 Q38 19 44 23 Q40 24 32 25 Q24 24 20 23 Z" fill="#92400e" />
      {/* Big eyes */}
      <circle cx="26" cy="31" r="2.2" fill="#fff" />
      <circle cx="26" cy="31.5" r="1.6" fill={SMILE} />
      <circle cx="26.5" cy="30.8" r="0.5" fill="#fff" />
      <circle cx="38" cy="31" r="2.2" fill="#fff" />
      <circle cx="38" cy="31.5" r="1.6" fill={SMILE} />
      <circle cx="38.5" cy="30.8" r="0.5" fill="#fff" />
      <path d="M23 27 Q26 26 29 27" stroke="#92400e" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <path d="M35 27 Q38 26 41 27" stroke="#92400e" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <path d="M26 37 Q32 41 38 37" stroke="#c2185b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <ellipse cx="22" cy="35" rx="2.5" ry="2" fill={CHEEK} opacity="0.7" />
      <ellipse cx="42" cy="35" rx="2.5" ry="2" fill={CHEEK} opacity="0.7" />
    </PortraitFrame>
  );
}

// ─── Mentor portraits ─────────────────────────────────────────────────────

function PMentorAnna({ size }) {
  return (
    <PortraitFrame size={size} bg="#fed7aa">
      <rect x="28" y="38" width="8" height="8" fill={SKIN} />
      {/* Blouse */}
      <path d="M10 64 Q10 48 32 48 Q54 48 54 64 Z" fill="#9333ea" />
      <path d="M27 49 L32 54 L37 49 L37 56 L27 56 Z" fill="#fff" />
      {/* Hair updo (bun) */}
      <ellipse cx="32" cy="14" rx="9" ry="6" fill="#7c2d12" />
      <path d="M17 28 Q15 14 32 14 Q49 14 47 28 L47 38 Q40 32 32 32 Q24 32 17 38 Z" fill="#7c2d12" />
      {/* Hair pin */}
      <rect x="28" y="11" width="8" height="2" rx="1" fill="#fbbf24" />
      {/* Face */}
      <ellipse cx="32" cy="29" rx="12.5" ry="13.5" fill={SKIN} />
      {/* Glasses */}
      <circle cx="27" cy="30" r="4.5" fill="none" stroke="#1a1a17" strokeWidth="1.4" />
      <circle cx="37" cy="30" r="4.5" fill="none" stroke="#1a1a17" strokeWidth="1.4" />
      <line x1="31.5" y1="30" x2="32.5" y2="30" stroke="#1a1a17" strokeWidth="1.4" />
      {/* Eyes behind glasses */}
      <circle cx="27" cy="30" r="1.2" fill={SMILE} />
      <circle cx="37" cy="30" r="1.2" fill={SMILE} />
      {/* Smile */}
      <path d="M27 37 Q32 40 37 37" stroke="#c2185b" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Cheek */}
      <ellipse cx="22" cy="34" rx="2" ry="1.5" fill={CHEEK} opacity="0.5" />
      <ellipse cx="42" cy="34" rx="2" ry="1.5" fill={CHEEK} opacity="0.5" />
      {/* Earrings */}
      <circle cx="19.5" cy="32" r="1" fill="#fbbf24" />
      <circle cx="44.5" cy="32" r="1" fill="#fbbf24" />
    </PortraitFrame>
  );
}

function PMentorMaxim({ size }) {
  return (
    <PortraitFrame size={size} bg="#bfdbfe">
      <rect x="27" y="38" width="10" height="8" fill={SKIN} />
      {/* Sweater */}
      <path d="M10 64 Q10 48 32 48 Q54 48 54 64 Z" fill="#1e40af" />
      {/* Collar */}
      <path d="M25 47 L32 53 L39 47 L37 55 L27 55 Z" fill="#1e3a8a" />
      {/* Face */}
      <ellipse cx="32" cy="28" rx="13" ry="14" fill={SKIN} />
      {/* Short hair, salt-and-pepper */}
      <path d="M19 22 Q19 12 32 12 Q45 12 45 22 L45 20 Q41 17 32 17 Q23 17 19 20 Z" fill="#374151" />
      <path d="M21 18 L22 16 M28 14 L29 12 M35 14 L36 12 M42 18 L43 16" stroke="#9ca3af" strokeWidth="0.8" strokeLinecap="round" />
      {/* Stubble shadow */}
      <ellipse cx="32" cy="38" rx="9" ry="3" fill="#374151" opacity="0.15" />
      <ellipse cx="22" cy="34" rx="3" ry="2.5" fill="#374151" opacity="0.1" />
      <ellipse cx="42" cy="34" rx="3" ry="2.5" fill="#374151" opacity="0.1" />
      {/* Eyes — confident */}
      <circle cx="27" cy="29" r="1.5" fill={SMILE} />
      <circle cx="37" cy="29" r="1.5" fill={SMILE} />
      {/* Strong eyebrows */}
      <rect x="23" y="25" width="7" height="1.6" rx="0.8" fill="#374151" />
      <rect x="34" y="25" width="7" height="1.6" rx="0.8" fill="#374151" />
      {/* Confident smile */}
      <path d="M26 35 Q32 38 38 35" stroke={SMILE} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* Slight cheek */}
      <ellipse cx="22" cy="32" rx="2" ry="1.5" fill={CHEEK} opacity="0.3" />
      <ellipse cx="42" cy="32" rx="2" ry="1.5" fill={CHEEK} opacity="0.3" />
    </PortraitFrame>
  );
}

function PKnopych({ size }) {
  return (
    <PortraitFrame size={size} bg="#1f2937">
      {/* Robot body */}
      <rect x="12" y="40" width="40" height="20" rx="6" fill="#374151" />
      {/* Connection neck */}
      <rect x="28" y="36" width="8" height="6" fill="#4b5563" />
      <circle cx="28" cy="38" r="1" fill="#10b981" />
      <circle cx="36" cy="38" r="1" fill="#10b981" />
      {/* Robot head */}
      <rect x="13" y="12" width="38" height="28" rx="8" fill="#e5e7eb" />
      <rect x="15" y="14" width="34" height="24" rx="6" fill="#1f2937" />
      {/* Screen */}
      <rect x="19" y="20" width="26" height="12" rx="2" fill="#10b981" />
      {/* Eyes on screen */}
      <rect x="22" y="23" width="6" height="6" rx="1" fill="#1f2937" />
      <rect x="36" y="23" width="6" height="6" rx="1" fill="#1f2937" />
      <circle cx="25" cy="26" r="1.5" fill="#10b981" />
      <circle cx="39" cy="26" r="1.5" fill="#10b981" />
      {/* Mouth (LED indicator) */}
      <path d="M26 34 L28 35 L30 34 L32 35 L34 34 L36 35 L38 34" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* Antenna */}
      <line x1="32" y1="12" x2="32" y2="6" stroke="#9ca3af" strokeWidth="1.5" />
      <circle cx="32" cy="5" r="2.5" fill="#ef4444" />
      <circle cx="32" cy="5" r="1" fill="#fbbf24" />
      {/* Side bolts */}
      <circle cx="14" cy="26" r="1.5" fill="#6b7280" />
      <circle cx="50" cy="26" r="1.5" fill="#6b7280" />
      {/* Key on chest */}
      <rect x="28" y="46" width="8" height="8" rx="1.5" fill="#fbbf24" />
      <text x="32" y="52" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="6" fontWeight="700" fill="#1f2937">К</text>
    </PortraitFrame>
  );
}

function PKlavochka({ size }) {
  return (
    <PortraitFrame size={size} bg="#fef3c7">
      {/* Painter's palette body shape - friendly creature */}
      {/* Body/dress */}
      <ellipse cx="32" cy="50" rx="22" ry="14" fill="#a78bfa" />
      <path d="M14 50 Q14 38 32 38 Q50 38 50 50" fill="#a78bfa" />
      {/* Head — round friendly */}
      <ellipse cx="32" cy="28" rx="16" ry="16" fill={SKIN_KID} />
      {/* Hair — colorful pastel mop */}
      <path d="M18 22 Q18 10 32 10 Q46 10 46 22 Q44 18 40 17 Q42 14 38 14 Q38 12 34 13 Q32 10 30 13 Q26 12 26 14 Q22 14 24 17 Q20 18 18 22 Z" fill="#fb7185" />
      {/* Hair color dots — like paint palette */}
      <circle cx="22" cy="17" r="2" fill="#fbbf24" />
      <circle cx="29" cy="13" r="2" fill="#34d399" />
      <circle cx="36" cy="13" r="2" fill="#60a5fa" />
      <circle cx="43" cy="17" r="2" fill="#a78bfa" />
      {/* Big sparkly eyes */}
      <circle cx="26" cy="29" r="3" fill="#fff" />
      <circle cx="26" cy="29.5" r="2.2" fill="#1a1a17" />
      <circle cx="26.7" cy="28.5" r="0.8" fill="#fff" />
      <circle cx="25.3" cy="30.2" r="0.4" fill="#fff" />
      <circle cx="38" cy="29" r="3" fill="#fff" />
      <circle cx="38" cy="29.5" r="2.2" fill="#1a1a17" />
      <circle cx="38.7" cy="28.5" r="0.8" fill="#fff" />
      <circle cx="37.3" cy="30.2" r="0.4" fill="#fff" />
      {/* Eyelashes */}
      <path d="M23.5 26.5 L23 25.5 M26 26 L26 25 M28.5 26.5 L29 25.5" stroke="#1a1a17" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M35.5 26.5 L35 25.5 M38 26 L38 25 M40.5 26.5 L41 25.5" stroke="#1a1a17" strokeWidth="0.7" strokeLinecap="round" />
      {/* Smile */}
      <path d="M26 36 Q32 40 38 36" stroke="#c2185b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Cheeks */}
      <ellipse cx="21" cy="34" rx="3" ry="2.2" fill={CHEEK} opacity="0.7" />
      <ellipse cx="43" cy="34" rx="3" ry="2.2" fill={CHEEK} opacity="0.7" />
    </PortraitFrame>
  );
}

// ─── Resolver ──────────────────────────────────────────────────────────────

function UserPortrait({ audience, gender, size = 56 }) {
  if (audience === 'adult') {
    return gender === 'f' ? <PAdultWoman size={size} /> : <PAdultMan size={size} />;
  }
  if (audience === 'teen') {
    return gender === 'f' ? <PTeenGirl size={size} /> : <PTeenBoy size={size} />;
  }
  if (audience === 'kid') {
    return gender === 'f' ? <PKidGirl size={size} /> : <PKidBoy size={size} />;
  }
  return null;
}

function MentorPortrait({ id, size = 56 }) {
  if (id === 'anna') return <PMentorAnna size={size} />;
  if (id === 'maxim') return <PMentorMaxim size={size} />;
  if (id === 'knopych') return <PKnopych size={size} />;
  if (id === 'klavochka') return <PKlavochka size={size} />;
  return null;
}

// Gender detection from Russian name — simple suffix heuristic w/ exceptions
function detectGender(name) {
  const n = (name || '').trim().toLowerCase();
  if (!n) return null;
  const masculineEndsA = new Set([
    'илья','никита','данила','савва','кузьма','фома','лука',
    'фока','гавриил','эмиля','сила','миха','паха','капа',
  ]);
  const feminineExceptions = new Set([
    'любовь','юдифь','эсфирь','нинель',
  ]);
  // Common short/diminutive masculine ending in -а/-я (Саша, Женя, Дима handled below if not in list)
  const ambiguous = new Set(['саша','женя','валя','шура','миша','паша','коля','ваня','юля']);
  if (masculineEndsA.has(n)) return 'm';
  if (feminineExceptions.has(n)) return 'f';
  if (ambiguous.has(n)) return 'm'; // default masculine for shorts; user can flip
  const last = n.slice(-1);
  const last2 = n.slice(-2);
  if (last === 'а' || last === 'я') return 'f';
  if (last2 === 'ь' && (n.endsWith('овь') || n.endsWith('адь'))) return 'f';
  return 'm';
}

Object.assign(window, {
  UserPortrait, MentorPortrait, detectGender,
  PAdultMan, PAdultWoman, PTeenBoy, PTeenGirl, PKidBoy, PKidGirl,
  PMentorAnna, PMentorMaxim, PKnopych, PKlavochka,
});
