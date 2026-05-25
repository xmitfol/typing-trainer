// Shared placeholder helpers across all main-page variants.
// Striped image slots with monospace captions, simple SVG marks, etc.

function PhotoPH({ w, h, label, bg, bg2, fg, radius, style }) {
  return (
    <div
      className="ph-stripes"
      style={{
        width: w === undefined ? "100%" : w,
        height: h,
        borderRadius: radius ?? 0,
        "--ph-bg": bg,
        "--ph-bg2": bg2,
        "--ph-fg": fg,
        ...style,
      }}
    >
      {label}
    </div>
  );
}

// Tiny coffee-bean SVG mark — used in logos and decorative spots.
function BeanMark({ size = 28, color = "#2b1f17" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <ellipse cx="16" cy="16" rx="9" ry="13" transform="rotate(-25 16 16)" fill={color} />
      <path
        d="M11.2 5.5 Q 16 16 20.8 26.5"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

// A horizontal rule with optional centered label, used as section delimiter.
function Rule({ color = "rgba(0,0,0,0.15)", label, labelStyle, style }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        ...style,
      }}
    >
      <div style={{ flex: 1, height: 1, background: color }} />
      {label && <div style={labelStyle}>{label}</div>}
      {label && <div style={{ flex: 1, height: 1, background: color }} />}
    </div>
  );
}

// Coffee-cup glyph — official brand mark. Used in masthead, footer, favicon.
// Single color, geometric, reads at small sizes (down to 16px).
function CupGlyph({ size = 32, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Saucer */}
      <ellipse cx="24" cy="36" rx="17" ry="3" fill={color} opacity="0.18" />
      {/* Cup body */}
      <path d="M8 16 L8 28 Q8 35 24 35 Q40 35 40 28 L40 16 Z" stroke={color} strokeWidth="2" fill="none" />
      {/* Coffee surface */}
      <ellipse cx="24" cy="16" rx="16" ry="3" fill={color} />
      {/* Steam */}
      <path d="M20 10 Q 23 6 20 2" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.55" />
      <path d="M28 10 Q 31 6 28 2" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.4" />
      {/* Handle */}
      <path d="M40 19 Q 46 21 44 26 Q 42 30 40 30" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

Object.assign(window, { PhotoPH, BeanMark, Rule, CupGlyph });
