// Category page — "Кофе по странам" — internal page in Variant A style.
// Reuses .vja palette + fonts from variant-journal.jsx (VJA_CSS injected globally).
// Adds category-specific CSS under .vja-cat scope.

// === Coffee-belt world map ================================================
// Stylized SVG world map with the tropical coffee belt highlighted
// and pin markers on the major producing countries.
function CoffeeBeltMap() {
  const ink = "rgba(34,26,20,0.10)";
  const inkStroke = "rgba(34,26,20,0.22)";
  const accent = "#7a2a2a";
  const dash = "rgba(34,26,20,0.30)";

  // Country pins — [x, y, code, share, size]
  // Coordinates are in SVG units (viewBox 720×300)
  const pins = [
    { x: 235, y: 200, code: "BR", share: "35%", big: true,  label: "right" },
    { x: 215, y: 175, code: "CO", share: "8.5%", label: "right" },
    { x: 220, y: 215, code: "PE", share: "2.5%", label: "right" },
    { x: 185, y: 130, code: "MX", share: "2%", label: "right" },
    { x: 200, y: 145, code: "HN", share: "3.5%", label: "left" },
    { x: 415, y: 148, code: "ET", share: "4.5%", label: "right" },
    { x: 425, y: 168, code: "KE·TZ·UG", share: "", label: "right" },
    { x: 590, y: 130, code: "VN", share: "19%", big: true, label: "left" },
    { x: 520, y: 138, code: "IN", share: "4.5%", label: "right" },
    { x: 615, y: 180, code: "ID", share: "7%", label: "right" },
  ];

  return (
    <svg
      className="belt-svg"
      viewBox="0 0 720 300"
      preserveAspectRatio="xMidYMid meet"
      aria-label="Карта стран-производителей кофе"
    >
      {/* Coffee belt — soft horizontal band from 25°N to 30°S */}
      <rect x="0" y="108" width="720" height="84" fill={accent} opacity="0.07" />

      {/* Tropic of Cancer (≈23.5°N) */}
      <line x1="0" y1="111" x2="720" y2="111" stroke={dash} strokeWidth="0.8" strokeDasharray="4 4" />
      <text x="6" y="106" fontFamily="'JetBrains Mono',monospace" fontSize="8" fill={accent} letterSpacing="1.5">
        TROPIC OF CANCER · 23°N
      </text>

      {/* Equator */}
      <line x1="0" y1="150" x2="720" y2="150" stroke={dash} strokeWidth="0.7" strokeDasharray="2 4" />
      <text x="6" y="146" fontFamily="'JetBrains Mono',monospace" fontSize="8" fill="rgba(34,26,20,0.55)" letterSpacing="1.5">
        EQUATOR · 0°
      </text>

      {/* Tropic of Capricorn (≈23.5°S) */}
      <line x1="0" y1="189" x2="720" y2="189" stroke={dash} strokeWidth="0.8" strokeDasharray="4 4" />
      <text x="6" y="201" fontFamily="'JetBrains Mono',monospace" fontSize="8" fill={accent} letterSpacing="1.5">
        TROPIC OF CAPRICORN · 23°S
      </text>

      {/* Continents — stylized blobs */}
      <g fill={ink} stroke={inkStroke} strokeWidth="0.6">
        {/* North America */}
        <path d="M 55 80 Q 80 50 130 45 Q 175 38 215 55 Q 235 75 232 100 Q 222 122 205 135 Q 200 148 195 158 L 178 158 Q 168 142 152 130 Q 125 116 95 102 Q 65 95 50 88 Z" />
        {/* Central America */}
        <path d="M 178 158 L 195 158 Q 198 165 192 172 Q 187 178 198 184 L 215 192 L 210 198 Q 200 195 188 188 Q 178 175 178 158 Z" />
        {/* South America */}
        <path d="M 210 198 Q 235 188 258 195 Q 275 210 275 235 Q 270 258 252 268 Q 232 270 218 258 Q 208 242 205 222 Z" />
        {/* Greenland (tiny) */}
        <path d="M 252 30 Q 270 25 275 38 Q 270 50 258 48 Q 250 42 252 30 Z" />
        {/* Europe */}
        <path d="M 318 62 Q 345 55 380 60 Q 405 70 405 85 Q 395 95 372 95 Q 350 95 332 88 Q 320 78 318 62 Z" />
        {/* North Africa + Sahara */}
        <path d="M 348 100 Q 388 95 425 105 Q 445 120 440 145 Q 435 165 420 180 L 395 195 Q 380 210 372 220 Q 360 225 355 212 Q 350 195 348 175 Q 348 150 345 125 Z" />
        {/* Middle East / Arabia */}
        <path d="M 425 105 Q 445 102 460 115 Q 465 132 455 142 Q 442 142 432 132 Q 425 122 425 105 Z" />
        {/* Asia (main mass) */}
        <path d="M 405 50 Q 460 35 530 32 Q 600 38 645 58 Q 660 80 650 100 Q 635 118 605 122 L 565 125 Q 545 125 525 130 Q 500 135 478 138 Q 455 138 440 130 Q 425 122 415 108 Q 408 88 405 70 Z" />
        {/* South-east Asia + Indochina */}
        <path d="M 560 140 Q 580 138 595 148 Q 600 162 590 172 Q 578 175 568 168 Q 562 158 560 140 Z" />
        {/* Indonesia (scattered islands) */}
        <ellipse cx="600" cy="180" rx="14" ry="4" />
        <ellipse cx="622" cy="178" rx="8" ry="3.5" />
        <ellipse cx="640" cy="183" rx="6" ry="3" />
        <ellipse cx="615" cy="190" rx="5" ry="2.5" />
        {/* Australia */}
        <path d="M 610 208 Q 645 200 678 212 Q 690 228 670 242 Q 638 245 615 238 Q 600 225 610 208 Z" />
        {/* New Zealand (tiny) */}
        <ellipse cx="700" cy="252" rx="5" ry="2.5" />
        {/* Madagascar */}
        <ellipse cx="438" cy="208" rx="3.5" ry="9" />
      </g>

      {/* Highlight coffee-belt portions of continents in subtle accent */}
      <g fill={accent} opacity="0.16">
        {/* S America belt portion */}
        <path d="M 210 198 Q 235 188 258 195 Q 275 210 275 235 Q 270 258 252 268 Q 232 270 218 258 Q 208 242 205 222 Z" />
        {/* C America belt portion */}
        <path d="M 178 158 L 195 158 Q 198 165 192 172 Q 187 178 198 184 L 215 192 L 210 198 Q 200 195 188 188 Q 178 175 178 158 Z" />
        {/* Africa belt portion (between tropics only) */}
        <path d="M 355 108 Q 390 102 425 110 Q 440 130 438 150 Q 435 170 420 185 Q 400 192 380 188 Q 365 178 358 158 Q 352 135 355 108 Z" />
        {/* India + SE Asia belt */}
        <path d="M 495 110 Q 540 108 580 115 Q 615 130 615 165 Q 600 185 565 188 Q 530 188 505 175 Q 488 155 490 132 Z" />
        {/* Indonesia */}
        <ellipse cx="600" cy="180" rx="14" ry="4" />
        <ellipse cx="622" cy="178" rx="8" ry="3.5" />
        <ellipse cx="640" cy="183" rx="6" ry="3" />
      </g>

      {/* Country pin markers */}
      {pins.map((p, i) => {
        const r = p.big ? 5 : 3.5;
        const ringR = p.big ? 11 : 8;
        const labelX = p.label === "left" ? p.x - r - 6 : p.x + r + 6;
        const anchor = p.label === "left" ? "end" : "start";
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={ringR} fill={accent} opacity="0.18" />
            <circle cx={p.x} cy={p.y} r={r} fill={accent} />
            <text
              x={labelX}
              y={p.y + 3}
              fontFamily="'JetBrains Mono',monospace"
              fontSize="9"
              fontWeight={p.big ? 700 : 500}
              letterSpacing="1.2"
              fill="rgba(34,26,20,0.85)"
              textAnchor={anchor}
            >
              {p.code}
              {p.share ? ` · ${p.share}` : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// === Page CSS =============================================================

const VJA_CAT_CSS = `
/* ---------- Category page scope ---------- */
.vja.vja-cat { padding: 0; }

/* ---------- Breadcrumbs (shared with article) ---------- */
.vja-cat-crumbs {
  padding: 22px 60px;
  display: flex; gap: 10px; align-items: center;
  font-family: 'Manrope', sans-serif;
  font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
  font-weight: 500;
  color: var(--ink-mute);
  border-bottom: 1px solid var(--rule);
}
.vja-cat-crumbs .home {
  display: inline-flex; align-items: center; gap: 4px;
  color: var(--accent);
}
.vja-cat-crumbs .sep { color: var(--rule); }
.vja-cat-crumbs .current { color: var(--ink); }

/* ---------- Page header ---------- */
.vja-cat-head {
  padding: 70px 60px 50px;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 70px;
  align-items: end;
  border-bottom: 1px solid var(--rule);
}
.vja-cat-head .left .kicker {
  display: flex; gap: 14px; align-items: center;
  margin-bottom: 22px;
}
.vja-cat-head .left .kicker .sep { width: 30px; height: 1px; background: var(--accent); opacity: 0.5; }
.vja-cat-head h1 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  font-size: 96px;
  line-height: 0.94;
  letter-spacing: -0.025em;
  margin: 0 0 18px;
}
.vja-cat-head h1 .em { font-style: italic; color: var(--accent); font-weight: 400; }
.vja-cat-head .deck {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 22px;
  line-height: 1.5;
  color: var(--ink-2);
  max-width: 620px;
  margin: 0;
}
.vja-cat-head .filters {
  display: flex; flex-direction: column; gap: 14px;
}
.vja-cat-head .filters .kicker {
  font-family: 'Manrope', sans-serif;
  font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--accent);
  font-weight: 700;
  margin-bottom: 4px;
}
.vja-cat-head .filters .row {
  display: flex; flex-wrap: wrap; gap: 8px;
}
.vja-cat-head .filters .chip {
  font-family: 'Manrope', sans-serif;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 14px;
  border: 1px solid var(--rule);
  border-radius: 999px;
  color: var(--ink);
  cursor: pointer;
}
.vja-cat-head .filters .chip.on {
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
}
.vja-cat-head .filters .sort {
  display: flex; align-items: center; gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--rule);
  font-family: 'Manrope', sans-serif;
  font-size: 12px;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
}
.vja-cat-head .filters .sort .it {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 17px;
  color: var(--ink);
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-color: var(--accent);
  text-decoration-thickness: 1px;
}

/* ---------- Coffee belt overview ---------- */
.vja-cat-belt {
  padding: 60px 60px 50px;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 70px;
  align-items: center;
  border-bottom: 1px solid var(--rule);
}
.vja-cat-belt .map {
  position: relative;
  aspect-ratio: 2.4 / 1;
  background: var(--paper);
  border: 1px solid var(--rule);
  padding: 22px;
  overflow: hidden;
}
.vja-cat-belt .map .belt-svg {
  display: block;
  width: 100%;
  height: 100%;
}
.vja-cat-belt .map .corner-lbl {
  position: absolute;
  left: 22px; top: 22px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
  background: var(--paper);
  padding: 4px 8px;
  border: 1px solid var(--rule);
  z-index: 2;
}
.vja-cat-belt .map .corner-lbl.r {
  left: auto;
  right: 22px;
  color: var(--ink-mute);
  border-color: var(--rule);
}
.vja-cat-belt .stats h3 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  font-size: 38px;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0 0 20px;
}
.vja-cat-belt .stats h3 .em { font-style: italic; color: var(--accent); }
.vja-cat-belt .stats .row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 18px;
  padding: 14px 0;
  border-top: 1px solid var(--rule);
  align-items: baseline;
}
.vja-cat-belt .stats .row:first-of-type { border-top: 1px solid var(--rule); }
.vja-cat-belt .stats .row:last-of-type { border-bottom: 1px solid var(--rule); }
.vja-cat-belt .stats .row .n {
  font-family: 'Cormorant Garamond', serif;
  font-size: 44px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--ink);
  min-width: 130px;
}
.vja-cat-belt .stats .row .n .unit {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 17px;
  color: var(--accent);
  margin-left: 4px;
  vertical-align: top;
}
.vja-cat-belt .stats .row .desc {
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--ink-mute);
}

/* ---------- Country in focus (compact, distinct from article hero) ---------- */
.vja-cat-focus {
  padding: 60px 60px;
  border-bottom: 1px solid var(--rule);
}
.vja-cat-focus .head {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 40px;
  align-items: end;
  margin-bottom: 28px;
}
.vja-cat-focus .head .label {
  font-family: 'Manrope', sans-serif;
  font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 12px;
}
.vja-cat-focus .head h2 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  font-size: 48px;
  line-height: 0.98;
  letter-spacing: -0.025em;
  margin: 0;
}
.vja-cat-focus .head h2 .em { font-style: italic; color: var(--accent); }
.vja-cat-focus .head .all {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 17px;
  color: var(--accent);
  border-bottom: 1px solid var(--accent);
  padding-bottom: 2px;
  margin-bottom: 8px;
}

.vja-cat-focus .panel {
  padding: 28px;
  background: var(--paper-2);
  border: 1px solid var(--rule);
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 28px;
  align-items: stretch;
}
.vja-cat-focus .left { display: flex; flex-direction: column; gap: 18px; }

/* 4 stat tiles in a 2x2 grid */
.vja-cat-focus .tiles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.vja-cat-focus .tile {
  padding: 16px 18px 14px;
  background: var(--paper);
}
.vja-cat-focus .tile.t1 { background: rgba(91,125,74,0.10); }
.vja-cat-focus .tile.t2 { background: rgba(212,166,75,0.13); }
.vja-cat-focus .tile.t3 { background: rgba(217,122,74,0.10); }
.vja-cat-focus .tile.t4 { background: rgba(122,42,42,0.08); }
.vja-cat-focus .tile .lbl {
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--ink-mute);
  margin-bottom: 8px;
}
.vja-cat-focus .tile .v {
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--ink);
}
.vja-cat-focus .tile .v .em {
  font-style: italic;
  color: var(--accent);
  font-size: 18px;
  margin-left: 3px;
}
.vja-cat-focus .tile .small {
  font-family: 'Cormorant Garamond', serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.25;
  color: var(--ink);
  margin-top: 2px;
}

/* 2 short takeaways */
.vja-cat-focus .keys {
  background: var(--paper);
  padding: 22px 24px;
}
.vja-cat-focus .keys ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }
.vja-cat-focus .keys li {
  display: grid;
  grid-template-columns: 14px 1fr;
  gap: 12px;
  align-items: start;
}
.vja-cat-focus .keys li::before {
  content: "";
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--accent);
  margin-top: 7px;
}
.vja-cat-focus .keys li .t {
  font-family: 'Cormorant Garamond', serif;
  font-size: 17px;
  line-height: 1.4;
  color: var(--ink);
}
.vja-cat-focus .keys li .t .strong { font-weight: 600; }
.vja-cat-focus .keys li .t .em { font-style: italic; color: var(--accent); }

/* Smaller country widget on the right */
.vja-cat-focus .widget {
  background: rgba(25,167,194,0.10);
  padding: 22px;
  text-align: center;
  display: flex; flex-direction: column;
  gap: 14px;
  align-items: center;
}
.vja-cat-focus .widget .country-name {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 30px;
  letter-spacing: -0.015em;
  line-height: 1;
  color: var(--ink);
  margin: 0;
}
.vja-cat-focus .widget .tagline {
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-mute);
}
.vja-cat-focus .widget .map {
  position: relative;
  width: 120px; aspect-ratio: 4/5;
}
.vja-cat-focus .widget .map svg {
  width: 100%; height: 100%; display: block;
}
.vja-cat-focus .widget .region-lbl {
  font-family: 'Manrope', sans-serif;
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-mute);
}

/* ---------- Region section ---------- */
.vja-cat-region {
  padding: 70px 60px;
  border-bottom: 1px solid var(--rule);
}
.vja-cat-region:last-of-type { border-bottom: 0; }
.vja-cat-region .head {
  display: grid;
  grid-template-columns: auto 1fr 280px;
  gap: 50px;
  align-items: end;
  margin-bottom: 40px;
}
.vja-cat-region .head .label {
  font-family: 'Manrope', sans-serif;
  font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 12px;
}
.vja-cat-region .head h2 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  font-size: 72px;
  line-height: 0.96;
  letter-spacing: -0.025em;
  margin: 0;
}
.vja-cat-region .head h2 .em { font-style: italic; color: var(--accent); }
.vja-cat-region .head .summary {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 18px;
  line-height: 1.55;
  color: var(--ink-2);
  max-width: 360px;
  padding-bottom: 6px;
}
.vja-cat-region .head .summary .strong {
  font-style: normal;
  font-weight: 500;
  color: var(--ink);
}
.vja-cat-region .head .summary .meta-row {
  margin-top: 12px;
  font-family: 'Manrope', sans-serif;
  font-style: normal;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-mute);
  display: flex; gap: 14px;
}
.vja-cat-region .head .summary .meta-row .dot { width: 4px; height: 4px; border-radius: 50%; background: var(--accent); align-self: center; }

/* Country card grid */
.vja-cat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  border-top: 1px solid var(--rule);
  border-left: 1px solid var(--rule);
}
.vja-cat-card {
  position: relative;
  padding: 28px 28px 24px;
  border-right: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
  background: var(--paper);
  cursor: pointer;
  transition: background .2s ease;
  min-height: 340px;
  display: flex; flex-direction: column;
}
.vja-cat-card:hover { background: var(--paper-2); }
.vja-cat-card .head-row {
  display: grid;
  grid-template-columns: 1fr 92px;
  gap: 18px;
  align-items: start;
  margin-bottom: 18px;
}
.vja-cat-card .head-row h3 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  font-size: 36px;
  line-height: 1.0;
  letter-spacing: -0.02em;
  margin: 4px 0 8px;
  color: var(--ink);
}
.vja-cat-card .meta-line {
  display: flex; gap: 10px; align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink-mute);
  margin-top: 4px;
}
.vja-cat-card .meta-line .code {
  color: var(--accent);
  font-weight: 500;
}
.vja-cat-card .meta-line .sep {
  width: 3px; height: 3px; border-radius: 50%; background: var(--rule);
}
.vja-cat-card .cover {
  width: 92px; height: 92px;
  position: relative;
  overflow: hidden;
  background-image:
    repeating-linear-gradient(135deg,
      rgba(34,26,20,0.08) 0,
      rgba(34,26,20,0.08) 6px,
      rgba(34,26,20,0.14) 6px,
      rgba(34,26,20,0.14) 12px),
    var(--ph-bg, var(--paper-2));
  background-color: var(--paper-2);
}
.vja-cat-card .cover .ph {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink);
  text-align: center;
  gap: 4px;
}
.vja-cat-card .cover .ph .code-watermark {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  font-style: italic;
  font-size: 22px;
  letter-spacing: -0.02em;
  color: var(--accent);
  text-transform: none;
  line-height: 1;
}
.vja-cat-card .cover .ph .lbl {
  font-size: 8px;
  letter-spacing: 0.18em;
  color: var(--ink-mute);
}
.vja-cat-card .rank-row {
  display: none;
}
.vja-cat-card .share {
  margin-bottom: 18px;
  margin-top: 6px;
}
.vja-cat-card .share .lbl-row {
  display: flex; justify-content: space-between;
  margin-bottom: 6px;
  font-family: 'Manrope', sans-serif;
  font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
}
.vja-cat-card .share .lbl-row .l { color: var(--ink-mute); }
.vja-cat-card .share .lbl-row .v {
  color: var(--ink);
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 17px;
  letter-spacing: 0;
  text-transform: none;
  margin-top: -4px;
}
.vja-cat-card .share .bar {
  height: 4px;
  background: var(--paper-2);
  position: relative;
}
.vja-cat-card .share .bar .fill {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  background: var(--accent);
}
.vja-cat-card .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: auto; }
.vja-cat-card .tag {
  font-family: 'Manrope', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.03em;
  color: var(--ink);
  padding: 4px 10px;
  background: var(--paper-2);
  border-radius: 999px;
}
.vja-cat-card .tag.acc {
  background: rgba(122,42,42,0.10);
  color: var(--accent);
}
.vja-cat-card .foot {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 16px;
  margin-top: 18px;
  border-top: 1px solid var(--rule);
}
.vja-cat-card .foot .meta {
  font-family: 'Manrope', sans-serif;
  font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--ink-mute);
}
.vja-cat-card .foot .read {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 16px;
  color: var(--accent);
  border-bottom: 1px solid var(--accent);
  padding-bottom: 1px;
}
.vja-cat-card .badge-pin {
  position: absolute;
  right: 26px; bottom: 22px;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0;
}
.vja-cat-card.featured {
  background: var(--ink);
  color: var(--paper);
}
.vja-cat-card.featured h3 { color: var(--paper); }
.vja-cat-card.featured .meta-line { color: rgba(244,238,226,0.55); }
.vja-cat-card.featured .meta-line .code { color: var(--accent-2); }
.vja-cat-card.featured .meta-line .sep { background: rgba(244,238,226,0.25); }
.vja-cat-card.featured .cover {
  background-image:
    repeating-linear-gradient(135deg,
      rgba(244,238,226,0.12) 0,
      rgba(244,238,226,0.12) 6px,
      rgba(244,238,226,0.22) 6px,
      rgba(244,238,226,0.22) 12px);
  background-color: var(--ink-2);
}
.vja-cat-card.featured .cover .ph { color: var(--paper); }
.vja-cat-card.featured .cover .ph .code-watermark { color: var(--accent-2); }
.vja-cat-card.featured .cover .ph .lbl { color: rgba(244,238,226,0.55); }
.vja-cat-card.featured .share .lbl-row .l { color: rgba(244,238,226,0.55); }
.vja-cat-card.featured .share .lbl-row .v { color: var(--paper); }
.vja-cat-card.featured .share .bar { background: rgba(244,238,226,0.18); }
.vja-cat-card.featured .share .bar .fill { background: var(--accent-2); }
.vja-cat-card.featured .tag { background: rgba(244,238,226,0.10); color: rgba(244,238,226,0.85); }
.vja-cat-card.featured .tag.acc { background: rgba(192,86,68,0.20); color: #e89c80; }
.vja-cat-card.featured .foot { border-color: rgba(244,238,226,0.15); }
.vja-cat-card.featured .foot .meta { color: rgba(244,238,226,0.55); }
.vja-cat-card.featured .foot .read { color: #e89c80; border-color: #e89c80; }
.vja-cat-card.featured:hover { background: var(--ink-2); }

/* ---------- Leaderboard ---------- */
.vja-cat-leader {
  padding: 80px 60px;
  background: var(--paper-2);
  border-bottom: 1px solid var(--rule);
}
.vja-cat-leader .head {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: end;
  margin-bottom: 40px;
}
.vja-cat-leader h2 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  font-size: 56px;
  line-height: 1;
  letter-spacing: -0.025em;
  margin: 0;
}
.vja-cat-leader h2 .em { font-style: italic; color: var(--accent); }
.vja-cat-leader .head .deck {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 19px;
  line-height: 1.5;
  color: var(--ink-2);
}
.vja-cat-leader table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Manrope', sans-serif;
}
.vja-cat-leader thead th {
  text-align: left;
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--ink-mute);
  padding: 12px 16px;
  border-bottom: 1px solid var(--rule);
}
.vja-cat-leader thead th.r { text-align: right; }
.vja-cat-leader tbody td {
  padding: 18px 16px;
  border-bottom: 1px solid var(--rule);
  vertical-align: middle;
}
.vja-cat-leader tbody td.r { text-align: right; }
.vja-cat-leader .rank-cell {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 24px;
  color: var(--accent);
  width: 50px;
}
.vja-cat-leader .country-cell {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  font-weight: 500;
  color: var(--ink);
  letter-spacing: -0.01em;
}
.vja-cat-leader .country-cell .reg {
  display: block;
  font-family: 'Manrope', sans-serif;
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-mute);
  margin-top: 4px;
}
.vja-cat-leader .bar-cell {
  width: 220px;
}
.vja-cat-leader .bar-cell .bar {
  height: 6px;
  background: var(--paper);
  border: 1px solid var(--rule);
  position: relative;
}
.vja-cat-leader .bar-cell .fill {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  background: var(--accent);
}
.vja-cat-leader .num-cell {
  font-family: 'Cormorant Garamond', serif;
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.02em;
  width: 160px;
}
.vja-cat-leader .num-cell .unit {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 14px;
  color: var(--accent);
  margin-left: 4px;
}
.vja-cat-leader .delta-cell {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.04em;
  width: 80px;
  text-align: right;
}
.vja-cat-leader .delta-cell.up { color: #5b7d4a; }
.vja-cat-leader .delta-cell.down { color: var(--accent); }

/* ---------- Glossary callout ---------- */
.vja-cat-gloss {
  padding: 80px 60px;
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 70px;
  align-items: start;
}
.vja-cat-gloss h2 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  font-size: 56px;
  line-height: 1;
  letter-spacing: -0.025em;
  margin: 14px 0 22px;
}
.vja-cat-gloss h2 .em { font-style: italic; color: var(--accent); }
.vja-cat-gloss p {
  font-family: 'Cormorant Garamond', serif;
  font-size: 19px;
  line-height: 1.6;
  color: var(--ink-2);
  margin: 0 0 14px;
}
.vja-cat-gloss p:first-of-type::first-letter {
  font-size: 64px;
  font-weight: 600;
  float: left;
  line-height: 0.9;
  margin: 6px 8px 0 0;
  color: var(--accent);
}
.vja-cat-gloss .terms {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.vja-cat-gloss .term {
  border-top: 1px solid var(--rule);
  padding-top: 16px;
}
.vja-cat-gloss .term .t {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 22px;
  margin-bottom: 6px;
}
.vja-cat-gloss .term .t .em { font-style: italic; color: var(--accent); font-weight: 400; }
.vja-cat-gloss .term .d {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--ink-mute);
}
`;

function PageCountries() {
  React.useEffect(() => {
    if (!document.getElementById("vja-style") && window.VJA_CSS) {
      const s = document.createElement("style");
      s.id = "vja-style";
      s.textContent = window.VJA_CSS;
      document.head.appendChild(s);
    }
    if (document.getElementById("vja-cat-style")) return;
    const s = document.createElement("style");
    s.id = "vja-cat-style";
    s.textContent = VJA_CAT_CSS;
    document.head.appendChild(s);
  }, []);

  const regions = [
    {
      id: "south",
      label: "Регион 01",
      title: "Южная Америка",
      em: "Америка",
      summary: <><span className="strong">Половина мирового кофе</span> родом отсюда — и&nbsp;ровно одна Бразилия даёт треть планетарного объёма.</>,
      meta: ["5 стран", "~50% мирового рынка", "Sep — Mar"],
      countries: [
        { code: "BR", name: "Бразилия", rank: 1, share: 35, varieties: ["Арабика 80%", "Робуста 20%", "Бурбон", "Mundo Novo"], note: "Cerrado · Sul de Minas", featured: true },
        { code: "CO", name: "Колумбия", rank: 3, share: 8.5, varieties: ["Арабика 100%", "Кастильо", "Caturra"], note: "Eje Cafetero" },
        { code: "PE", name: "Перу", rank: 8, share: 2.5, varieties: ["Арабика 100%", "Typica", "Caturra", "Organic"], note: "Cajamarca · Cuzco" },
      ],
    },
    {
      id: "central",
      label: "Регион 02",
      title: "Центральная Америка",
      em: "Америка",
      summary: <><span className="strong">Кислотный профиль и&nbsp;цветочные ноты</span> — здесь зерно растёт на&nbsp;вулканических почвах под&nbsp;тенью банановых пальм.</>,
      meta: ["6 стран", "~10% мирового рынка", "Oct — Apr"],
      countries: [
        { code: "HN", name: "Гондурас", rank: 6, share: 3.5, varieties: ["Арабика 100%", "Catuai", "Bourbon", "Pacas"], note: "Marcala · Copán" },
        { code: "GT", name: "Гватемала", rank: 10, share: 2.0, varieties: ["Арабика 100%", "Bourbon", "Caturra"], note: "Antigua · Huehuetenango" },
        { code: "MX", name: "Мексика", rank: 12, share: 2.0, varieties: ["Арабика 96%", "Робуста 4%", "Typica"], note: "Chiapas · Veracruz" },
      ],
    },
    {
      id: "africa",
      label: "Регион 03",
      title: "Африка",
      em: "Африка",
      summary: <><span className="strong">Родина арабики</span> — и&nbsp;до&nbsp;сих&nbsp;пор источник самых ярких ягодных и&nbsp;цитрусовых профилей.</>,
      meta: ["7 стран", "~12% мирового рынка", "Oct — Feb"],
      countries: [
        { code: "ET", name: "Эфиопия", rank: 5, share: 4.5, varieties: ["Arabica heirloom", "Yirgacheffe", "Sidamo", "Harrar"], note: "Heirloom genetics", featured: true },
        { code: "UG", name: "Уганда", rank: 9, share: 2.3, varieties: ["Робуста 80%", "Арабика 20%", "Bugisu"], note: "Mount Elgon" },
        { code: "TZ", name: "Танзания", rank: 15, share: 1.0, varieties: ["Арабика 70%", "Bourbon", "N39", "Nyasa", "Typica"], note: "Kilimanjaro · Mbeya" },
        { code: "KE", name: "Кения", rank: 16, share: 0.9, varieties: ["SL28", "SL34", "K7", "Ruiru 11", "Batian"], note: "Nyeri · Kirinyaga" },
        { code: "RW", name: "Руанда", rank: 28, share: 0.3, varieties: ["Bourbon Mayaguez", "Jackson", "Mibirizi"], note: "Lake Kivu" },
        { code: "BI", name: "Бурунди", rank: 32, share: 0.2, varieties: ["Red Bourbon", "Jackson", "Mibirizi"], note: "Kayanza · Ngozi" },
      ],
    },
    {
      id: "asia",
      label: "Регион 04",
      title: "Азия и Океания",
      em: "Океания",
      summary: <><span className="strong">Тяжёлая робуста и&nbsp;муссонная арабика</span> — Вьетнам один даёт всю мировую робусту, а&nbsp;Индия — единственный кофе, дозревающий под&nbsp;муссоном.</>,
      meta: ["6 стран", "~28% мирового рынка", "Nov — Mar"],
      countries: [
        { code: "VN", name: "Вьетнам", rank: 2, share: 19, varieties: ["Робуста 95%", "Арабика 5%", "Catimor"], note: "Central Highlands", cover: "linear-gradient(135deg, #6b8a4a 0%, #2a3a18 100%)", featured: true },
        { code: "ID", name: "Индонезия", rank: 4, share: 7, varieties: ["Робуста 75%", "Sumatra", "Mandheling", "Java"], note: "Sumatra · Sulawesi · Bali", cover: "linear-gradient(135deg, #4a7058 0%, #1a3022 100%)" },
        { code: "IN", name: "Индия", rank: 6, share: 4.5, varieties: ["Арабика 40%", "Робуста 60%", "Monsooned Malabar"], note: "Karnataka · Kerala", cover: "linear-gradient(135deg, #b07a3a 0%, #4a2810 100%)" },
      ],
    },
  ];

  return (
    <div className="vja vja-cat">
      {/* Masthead */}
      <div className="vja-masthead">
        <div className="brand">
          <CupGlyph size={36} color="#7a2a2a" />
          <div className="brand-text">
            <div className="name">Все&nbsp;<span className="em">кофе</span></div>
            <div className="tag">Большая энциклопедия кофе</div>
          </div>
        </div>
        <div></div>
        <div className="right">
          <div className="search">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="m11 11 4 4"/></svg>
            <span>Поиск по сайту</span>
          </div>
          <div className="soc">
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic"}}>vk</span>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic"}}>tg</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="vja-nav">
        <a><span className="num">I</span>О Кофе</a>
        <a className="active"><span className="num">II</span>По странам</a>
        <a><span className="num">III</span>Как готовить</a>
        <a><span className="num">IV</span>Рецепты</a>
        <a><span className="num">V</span>Полезно знать</a>
      </nav>

      {/* Breadcrumbs */}
      <div className="vja-cat-crumbs">
        <span className="home">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 8 L8 2 L14 8 L14 14 L10 14 L10 10 L6 10 L6 14 L2 14 Z" />
          </svg>
          Главная
        </span>
        <span className="sep">›</span>
        <span className="current">По странам</span>
      </div>

      {/* Page header */}
      <section className="vja-cat-head">
        <div className="left">
          <div className="kicker">
            <span className="meta">География · Каталог</span>
            <span className="sep"></span>
            <span className="meta">28 стран · 412 материалов</span>
          </div>
          <h1>
            Кофе по&nbsp;<span className="em">странам</span>
          </h1>
          <p className="deck">
            Карта мирового производства кофе — страны-производители по&nbsp;регионам, с&nbsp;долей рынка, основными сортами и&nbsp;характером вкуса.
          </p>
        </div>
        <aside className="filters">
          <div className="kicker">Фильтры</div>
          <div className="row">
            <span className="chip on">Все регионы</span>
            <span className="chip">Южная Америка</span>
            <span className="chip">Африка</span>
            <span className="chip">Азия</span>
          </div>
          <div className="row" style={{marginTop: 6}}>
            <span className="chip">Арабика</span>
            <span className="chip">Робуста</span>
            <span className="chip">Спешелти</span>
          </div>
          <div className="sort">
            Сортировка: <span className="it">по доле рынка ↓</span>
          </div>
        </aside>
      </section>

      {/* Coffee belt overview */}
      <section className="vja-cat-belt">
        <div className="map">
          <span className="corner-lbl">Coffee Belt · 25°С — 30°Ю</span>
          <span className="corner-lbl r">Производители · 28 стран</span>
          <CoffeeBeltMap />
        </div>
        <div className="stats">
          <h3>Кофе растёт <span className="em">только&nbsp;в&nbsp;тропиках</span></h3>
          <div className="row">
            <div className="n">28<span className="unit">стран</span></div>
            <div className="desc">в&nbsp;нашем каталоге производят кофе на&nbsp;промышленных объёмах.</div>
          </div>
          <div className="row">
            <div className="n">9.8<span className="unit">млн&nbsp;т</span></div>
            <div className="desc">мирового производства кофе в&nbsp;2025 году, по&nbsp;данным ICO.</div>
          </div>
          <div className="row">
            <div className="n">63<span className="unit">%</span></div>
            <div className="desc">арабики и&nbsp;37% робусты в&nbsp;общем мировом объёме.</div>
          </div>
          <div className="row">
            <div className="n">1100<span className="unit">— 2200&nbsp;м</span></div>
            <div className="desc">оптимальная высота для&nbsp;арабики над&nbsp;уровнем моря.</div>
          </div>
        </div>
      </section>

      {/* Country in focus */}
      <section className="vja-cat-focus">
        <div className="head">
          <div>
            <div className="label">Страна в&nbsp;фокусе</div>
            <h2>Бразилия — <span className="em">треть мирового объёма</span></h2>
          </div>
          <a className="all">Читать материал →</a>
        </div>
        <div className="panel">
          <div className="left">
            <div className="tiles">
              <div className="tile t1">
                <div className="lbl">В мире</div>
                <div className="v">№&nbsp;1</div>
              </div>
              <div className="tile t2">
                <div className="lbl">Доля рынка</div>
                <div className="v">35<span className="em">%</span></div>
              </div>
              <div className="tile t3">
                <div className="lbl">Объём</div>
                <div className="v">3,4<span className="em">млн т</span></div>
              </div>
              <div className="tile t4">
                <div className="lbl">Сорта</div>
                <div className="small">Bourbon, Mundo&nbsp;Novo</div>
              </div>
            </div>
            <div className="keys">
              <ul>
                <li><span className="t"><span className="strong">Cerrado, Sul de Minas, Mogiana</span> — вулканические почвы до&nbsp;1200 м.</span></li>
                <li><span className="t">Производит и&nbsp;арабику, и&nbsp;<span className="em">робусту</span> — редкий случай среди производителей.</span></li>
                <li><span className="t">300&nbsp;тыс. ферм, 5&nbsp;млн занятых, экспорт в&nbsp;150 стран.</span></li>
              </ul>
            </div>
          </div>
          <div className="widget">
            <h3 className="country-name">Бразилия</h3>
            <div className="tagline">Крупнейший производитель</div>
            <div className="map" aria-label="Карта Бразилии">
              <svg viewBox="0 0 140 180" fill="none" aria-hidden="true">
                <path d="M58 22 L74 18 L86 22 L96 32 L102 46 L100 60 L98 78 L94 96 L88 116 L78 132 L70 142 L62 148 L54 144 L48 134 L46 120 L48 106 L52 92 L48 78 L42 66 L40 50 L42 36 L48 26 Z"
                      fill="rgba(34,26,20,0.06)" />
                <path d="M70 40 L82 38 L92 46 L98 58 L96 72 L92 86 L86 100 L78 112 L72 122 L66 128 L58 124 L52 114 L50 100 L54 86 L58 72 L62 58 L66 48 Z"
                      fill="var(--accent)"
                      stroke="var(--accent)"
                      strokeWidth="0.5" />
                <circle cx="70" cy="106" r="3" fill="var(--paper)" stroke="var(--accent)" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="region-lbl">Южная Америка</div>
          </div>
        </div>
      </section>

      {/* Region sections */}
      {regions.map((r) => (
        <section className="vja-cat-region" key={r.id}>
          <div className="head">
            <div>
              <div className="label">{r.label}</div>
              <h2>
                {r.title.split(r.em)[0]}
                <span className="em">{r.em}</span>
                {r.title.split(r.em)[1]}
              </h2>
            </div>
            <div></div>
            <div className="summary">
              {r.summary}
              <div className="meta-row">
                {r.meta.map((m, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="dot"></span>}
                    <span>{m}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          <div className="vja-cat-grid">
            {r.countries.map((c) => (
              <article className={"vja-cat-card" + (c.featured ? " featured" : "")} key={c.code}>
                <div className="head-row">
                  <div>
                    <h3>{c.name}</h3>
                    <div className="meta-line">
                      <span className="code">{c.code}</span>
                      <span className="sep"></span>
                      <span>№&nbsp;{c.rank} в&nbsp;мире</span>
                    </div>
                  </div>
                  <div className="cover">
                    <div className="ph">
                      <span className="code-watermark">{c.code}</span>
                      <span className="lbl">фото</span>
                    </div>
                  </div>
                </div>
                <div className="share">
                  <div className="lbl-row">
                    <span className="l">Доля рынка</span>
                    <span className="v">{c.share}%</span>
                  </div>
                  <div className="bar">
                    <div className="fill" style={{width: `${Math.min(c.share * 2.5, 100)}%`}}></div>
                  </div>
                </div>
                <div className="tags">
                  {c.varieties.map((v, i) => (
                    <span className={"tag" + (i === 0 ? " acc" : "")} key={i}>{v}</span>
                  ))}
                </div>
                <div className="foot">
                  <span className="meta">{c.note}</span>
                  <a className="read">Читать →</a>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {/* Leaderboard */}
      <section className="vja-cat-leader">
        <div className="head">
          <div>
            <div className="kicker" style={{
              fontFamily:"'Manrope',sans-serif",
              fontSize:11, letterSpacing:'0.22em', textTransform:'uppercase',
              fontWeight:700, color:'var(--accent)',
              marginBottom: 14,
            }}>
              Топ-10 · 2025
            </div>
            <h2>Кто <span className="em">производит</span> больше&nbsp;всех</h2>
          </div>
          <p className="deck">
            Десять стран, на&nbsp;которые приходится почти 85% мирового кофе. Третий год Бразилия и&nbsp;Вьетнам держат отрыв более чем в&nbsp;два раза от&nbsp;ближайшего соседа.
          </p>
        </div>
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Страна</th>
              <th>Доля</th>
              <th className="r">Объём, тыс.&nbsp;т</th>
              <th className="r">2024 → 2025</th>
            </tr>
          </thead>
          <tbody>
            {[
              { rank: "01", country: "Бразилия", region: "Южная Америка", share: 35, volume: 3430, delta: "+2.4%", up: true },
              { rank: "02", country: "Вьетнам", region: "Азия", share: 19, volume: 1860, delta: "−4.1%", up: false },
              { rank: "03", country: "Колумбия", region: "Южная Америка", share: 8.5, volume: 832, delta: "+5.8%", up: true },
              { rank: "04", country: "Индонезия", region: "Азия", share: 7, volume: 686, delta: "+1.2%", up: true },
              { rank: "05", country: "Эфиопия", region: "Африка", share: 4.5, volume: 441, delta: "+3.6%", up: true },
              { rank: "06", country: "Индия", region: "Азия", share: 4.5, volume: 441, delta: "−0.8%", up: false },
              { rank: "07", country: "Гондурас", region: "Центральная Америка", share: 3.5, volume: 343, delta: "+0.4%", up: true },
              { rank: "08", country: "Перу", region: "Южная Америка", share: 2.5, volume: 245, delta: "+2.1%", up: true },
              { rank: "09", country: "Уганда", region: "Африка", share: 2.3, volume: 225, delta: "+6.4%", up: true },
              { rank: "10", country: "Гватемала", region: "Центральная Америка", share: 2.0, volume: 196, delta: "−1.5%", up: false },
            ].map((r) => (
              <tr key={r.rank}>
                <td className="rank-cell">{r.rank}</td>
                <td className="country-cell">
                  {r.country}
                  <span className="reg">{r.region}</span>
                </td>
                <td className="bar-cell">
                  <div className="bar">
                    <div className="fill" style={{width: `${r.share / 35 * 100}%`}}></div>
                  </div>
                </td>
                <td className="r num-cell">
                  {r.volume}
                  <span className="unit">тыс. т</span>
                </td>
                <td className={"r delta-cell " + (r.up ? "up" : "down")}>{r.delta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Glossary callout */}
      <section className="vja-cat-gloss">
        <div>
          <span className="kicker" style={{
            fontFamily:"'Manrope',sans-serif",
            fontSize:11, letterSpacing:'0.22em', textTransform:'uppercase',
            fontWeight:700, color:'var(--accent)',
          }}>
            Полезно знать
          </span>
          <h2>Как читать&nbsp;<span className="em">эти карточки</span></h2>
          <p>
            Каждая страна — это&nbsp;климат, высота, традиция обработки и&nbsp;вкусовой почерк. Доля рынка показывает, сколько кофе уезжает из&nbsp;неё на&nbsp;мировой стол, ранг — место в&nbsp;общем зачёте.
          </p>
          <p>
            Сорта — не&nbsp;маркетинг, а&nbsp;генетика: за&nbsp;каждым стоит свой профиль кислотности, тела и&nbsp;аромата. Их&nbsp;стоит читать как&nbsp;этикетку вина.
          </p>
        </div>
        <div className="terms">
          {[
            { t: "Арабика", em: "(Coffea arabica)", d: "Самый ароматный вид. Растёт на&nbsp;высоте от&nbsp;800&nbsp;м, любит тень и&nbsp;умеренные температуры." },
            { t: "Робуста", em: "(C. canephora)", d: "Крепкий и&nbsp;горький вид. Больше кофеина, выше урожайность, ниже капризность." },
            { t: "Бурбон", em: "Bourbon", d: "Историческая разновидность арабики с&nbsp;острова Реюньон. Сладкий, сложный, цветочный." },
            { t: "Sumatra", em: "wet-hulled", d: "Влажная очистка по-индонезийски — даёт землистый, густой, низкокислотный вкус." },
            { t: "Monsooned", em: "Malabar", d: "Уникальная индийская обработка: зерно три месяца выдерживают под&nbsp;муссоном." },
            { t: "Caturra", em: "Caturra", d: "Мутация бурбона. Карликовое дерево, легче собирать, чистый кофейный профиль." },
          ].map((g, i) => (
            <div className="term" key={i}>
              <div className="t">{g.t} <span className="em">{g.em}</span></div>
              <div className="d" dangerouslySetInnerHTML={{__html: g.d}} />
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="vja-foot">
        <div className="top">
          <div className="brand">
            <div className="lockup">
              <CupGlyph size={40} color="#d97a4a" />
              <div className="n">Все&nbsp;<span className="em">кофе</span></div>
            </div>
            <p>© 2022—2026 · Большая энциклопедия кофе. Все материалы защищены авторским правом.</p>
            <div className="meta" style={{color: 'rgba(244,238,226,0.7)'}}>@vsecoffee · info@vsecoffee.ru</div>
          </div>
          <div>
            <h4>Разделы</h4>
            <ul>
              <li>О Кофе</li>
              <li>По странам</li>
              <li>Как готовить</li>
              <li>Рецепты</li>
              <li>Полезно знать</li>
            </ul>
          </div>
          <div>
            <h4>Полезное</h4>
            <ul>
              <li>О нас</li>
              <li>Глоссарий</li>
              <li>Карта сайта</li>
            </ul>
          </div>
          <div className="news">
            <h4>Подписка</h4>
            <p style={{fontFamily: "'Cormorant Garamond',serif", fontStyle:"italic", fontSize: 17, color: "rgba(244,238,226,0.8)", margin:"0 0 14px"}}>
              Раз в&nbsp;месяц — лучшие материалы в&nbsp;вашу почту.
            </p>
            <input placeholder="ваш@email.ru" />
            <div className="btn">Подписаться →</div>
          </div>
        </div>
        <div className="bottom">
          <div>vsecoffee.ru</div>
          <div>Все кофе · Большая энциклопедия</div>
        </div>
      </footer>
    </div>
  );
}

window.PageCountries = PageCountries;
