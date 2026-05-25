// Article page — internal page in Variant A "Редакция" style.
// Subject: "Кофе в Индии — история, регионы, сорта".
// Reuses .vja palette + fonts from variant-journal.jsx (VJA_CSS).
// Adds article-specific CSS under .vja-article scope.

const VJA_ART_CSS = `
/* ---------- Article scope ---------- */
.vja.vja-article { padding: 0; }

/* ---------- Breadcrumbs ---------- */
.vja-art-crumbs {
  padding: 22px 60px 6px;
  display: flex; gap: 10px; align-items: center;
  font-family: 'Manrope', sans-serif;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--ink-mute);
}
.vja-art-crumbs a { color: var(--ink-mute); text-decoration: none; }
.vja-art-crumbs .home {
  width: 14px; height: 14px;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--accent);
}
.vja-art-crumbs .sep { opacity: 0.5; }
.vja-art-crumbs .cur { color: var(--ink); font-weight: 600; }

/* ---------- Article header ---------- */
.vja-art-header {
  padding: 30px 60px 40px;
}
.vja-art-header .kicker { margin-bottom: 22px; display: flex; gap: 14px; align-items: center; }
.vja-art-header .kicker .sep { width: 30px; height: 1px; background: var(--accent); opacity: 0.5; }
.vja-art-header h1 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  font-size: 78px;
  line-height: 1.0;
  letter-spacing: -0.02em;
  margin: 0 0 0;
  max-width: 1020px;
}
.vja-art-header h1 .em { font-style: italic; color: var(--accent); }
.vja-art-header .deck {
  font-family: 'Cormorant Garamond', serif;
  font-size: 24px;
  line-height: 1.45;
  font-style: italic;
  color: var(--ink-2);
  margin: 26px 0 0;
  max-width: 760px;
}
.vja-art-header .byline-row {
  margin-top: 38px;
  padding-top: 22px;
  border-top: 1px solid var(--rule);
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 32px;
  align-items: center;
}
.vja-art-header .author { display: flex; gap: 14px; align-items: center; }
.vja-art-header .author .av {
  width: 54px; height: 54px; border-radius: 50%;
}
.vja-art-header .author .name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 21px;
  font-weight: 600;
  line-height: 1.1;
}
.vja-art-header .author .role {
  font-family: 'Manrope', sans-serif;
  font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--ink-mute);
  margin-top: 4px;
}
.vja-art-header .meta-info {
  display: flex; gap: 28px; align-items: center;
  font-family: 'Manrope', sans-serif; font-size: 12px;
  color: var(--ink-mute);
  letter-spacing: 0.06em;
}
.vja-art-header .meta-info .li {
  display: flex; gap: 8px; align-items: center;
}
.vja-art-header .meta-info .li::before {
  content: ""; width: 4px; height: 4px; border-radius: 50%; background: var(--accent);
}
.vja-art-header .meta-info .li.first::before { display: none; }
.vja-art-header .share {
  display: flex; gap: 8px;
}
.vja-art-header .share .ic {
  width: 36px; height: 36px; border-radius: 50%;
  border: 1px solid var(--rule);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Cormorant Garamond', serif; font-style: italic;
  font-size: 13px; color: var(--ink-mute);
}

/* ---------- Hero figure ---------- */
.vja-art-figure {
  padding: 0 60px 30px;
}
.vja-art-figure .ph-frame {
  position: relative;
  aspect-ratio: 16/8;
  background:
    repeating-linear-gradient(135deg, #cbb892 0, #cbb892 10px, #b9a378 10px, #b9a378 20px);
  display: flex; align-items: center; justify-content: center;
}
.vja-art-figure .ph-frame .stamp {
  position: absolute; left: 24px; top: 24px;
  background: var(--paper);
  padding: 6px 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink);
}
.vja-art-figure .ph-frame .ph-msg {
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
  color: rgba(40,28,16,0.55);
}
.vja-art-figure .ph-frame .ph-msg .big {
  display: block;
  font-family: 'Cormorant Garamond', serif; font-style: italic;
  font-weight: 500; font-size: 32px;
  letter-spacing: -0.01em;
  color: var(--ink);
  margin-bottom: 6px;
  text-transform: none;
}
.vja-art-figure .cap {
  margin-top: 12px;
  display: flex; justify-content: space-between;
  font-family: 'Manrope', sans-serif; font-size: 11px;
  letter-spacing: 0.06em; color: var(--ink-mute);
}
.vja-art-figure .cap .it {
  font-family: 'Cormorant Garamond', serif; font-style: italic;
  font-size: 15px; color: var(--ink); letter-spacing: 0;
}

/* ---------- Country fact panel ---------- */
.vja-art-fact {
  margin: 20px 60px 0;
  padding: 36px;
  background: var(--paper-2);
  border: 1px solid var(--rule);
  display: grid;
  grid-template-columns: 1fr 1fr 1.15fr;
  gap: 36px;
  align-items: stretch;
}

/* --- Pastel fact table (left column) --- */
.vja-art-fact .specs h4,
.vja-art-fact .keys h4,
.vja-art-fact .widget h4 {
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 16px;
}
.vja-art-fact .specs ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.vja-art-fact .specs li {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 14px;
  padding: 14px 16px;
  align-items: baseline;
  background: var(--paper);
}
.vja-art-fact .specs li.t1 { background: rgba(91,125,74,0.10); }     /* olive */
.vja-art-fact .specs li.t2 { background: rgba(212,166,75,0.13); }    /* gold */
.vja-art-fact .specs li.t3 { background: rgba(217,122,74,0.10); }    /* terracotta */
.vja-art-fact .specs li.t4 { background: rgba(122,42,42,0.08); }     /* accent wine */
.vja-art-fact .specs li.t5 { background: rgba(25,167,194,0.10); }    /* teal */
.vja-art-fact .specs li.t6 { background: rgba(60,60,90,0.08); }      /* slate */
.vja-art-fact .specs li .k {
  font-family: 'Manrope', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--ink);
  text-transform: none;
}
.vja-art-fact .specs li .v {
  font-family: 'Cormorant Garamond', serif;
  font-size: 17px;
  line-height: 1.3;
  color: var(--ink);
}
.vja-art-fact .specs li .v .em { font-style: italic; color: var(--accent); }

/* --- Key takeaways bullets (middle column) --- */
.vja-art-fact .keys {
  background: var(--paper);
  padding: 26px;
  display: flex; flex-direction: column;
}
.vja-art-fact .keys ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 18px; }
.vja-art-fact .keys li {
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 14px;
  align-items: start;
}
.vja-art-fact .keys li::before {
  content: "";
  width: 10px; height: 10px;
  border-radius: 50%;
  border: 1.5px solid var(--accent);
  margin-top: 7px;
}
.vja-art-fact .keys li.acc::before {
  background: var(--accent);
}
.vja-art-fact .keys li .t {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  line-height: 1.4;
  color: var(--ink);
}
.vja-art-fact .keys li .t .strong { font-weight: 600; color: var(--ink); }
.vja-art-fact .keys li .t .em { font-style: italic; color: var(--accent); }

/* --- Country widget (right column) --- */
.vja-art-fact .widget {
  background: rgba(25,167,194,0.10);
  padding: 26px;
  position: relative;
  display: grid;
  grid-template-columns: 1fr 130px;
  gap: 22px;
  align-items: center;
}
.vja-art-fact .widget .head {
  grid-column: 1 / -1;
  text-align: center;
}
.vja-art-fact .widget .country-name {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 38px;
  letter-spacing: -0.015em;
  line-height: 1;
  color: var(--ink);
  margin: 0;
}
.vja-art-fact .widget .country-name .em { font-style: italic; color: var(--accent); }
.vja-art-fact .widget .tagline {
  font-family: 'Manrope', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-mute);
  margin-top: 8px;
}
.vja-art-fact .widget .map {
  position: relative;
  aspect-ratio: 4/5;
  background: transparent;
  display: flex; align-items: center; justify-content: center;
}
.vja-art-fact .widget .map svg {
  width: 100%; height: 100%;
  display: block;
}
.vja-art-fact .widget .map .region-lbl {
  position: absolute;
  bottom: -4px; left: 50%;
  transform: translateX(-50%);
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-mute);
}
.vja-art-fact .widget .side {
  display: flex; flex-direction: column;
  gap: 14px;
}
.vja-art-fact .widget .side h5 {
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink);
  margin: 0 0 4px;
}
.vja-art-fact .widget .side .lbl {
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-mute);
  margin-bottom: 3px;
}
.vja-art-fact .widget .side .val {
  font-family: 'Cormorant Garamond', serif;
  font-size: 16px;
  line-height: 1.3;
  color: var(--ink);
}
.vja-art-fact .widget .side .val.big {
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1;
}
/* ---------- Article body ---------- */
.vja-art-body {
  padding: 70px 60px;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 70px;
  align-items: start;
}
.vja-art-body .body {
  max-width: 720px;
}
.vja-art-body .lede {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  line-height: 1.55;
  color: var(--ink);
  margin: 0 0 28px;
}
.vja-art-body .lede::first-letter {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 78px;
  float: left;
  line-height: 0.85;
  margin: 8px 12px 0 0;
  color: var(--accent);
}
.vja-art-body p {
  font-family: 'Cormorant Garamond', serif;
  font-size: 19px;
  line-height: 1.65;
  color: var(--ink);
  margin: 0 0 18px;
}
.vja-art-body strong { font-weight: 600; color: var(--ink); }
.vja-art-body p .accent { color: var(--accent); font-style: italic; }
.vja-art-body h2 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  font-size: 42px;
  line-height: 1.05;
  letter-spacing: -0.015em;
  margin: 50px 0 22px;
  color: var(--ink);
}
.vja-art-body h2 .num {
  display: block;
  font-family: 'Manrope', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 14px;
}
.vja-art-body h3 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 26px;
  margin: 36px 0 12px;
  color: var(--ink);
}
.vja-art-body figure { margin: 30px 0; }
.vja-art-body figure .ph {
  background-image: repeating-linear-gradient(135deg, #cbb892 0, #cbb892 8px, #b9a378 8px, #b9a378 16px);
  aspect-ratio: 16/9;
  display: flex; align-items: center; justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
  color: rgba(40,28,16,0.55);
}
.vja-art-body figure figcaption {
  margin-top: 10px;
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 15px;
  color: var(--ink-mute);
}
.vja-art-body figure figcaption .cred {
  font-family: 'Manrope', sans-serif;
  font-style: normal;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-mute);
  margin-left: 6px;
}
.vja-art-body blockquote.pull {
  border: 0;
  margin: 36px -20px;
  padding: 0;
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-weight: 500;
  font-size: 32px;
  line-height: 1.25;
  color: var(--accent);
  letter-spacing: -0.005em;
  position: relative;
}
.vja-art-body blockquote.pull::before {
  content: "\\201C";
  font-family: 'Cormorant Garamond', serif;
  font-size: 110px;
  line-height: 1; position: absolute;
  left: -30px; top: 14px;
  color: var(--accent); opacity: 0.25;
}
.vja-art-body .callout {
  margin: 28px 0;
  padding: 22px 26px;
  background: var(--paper-2);
  border-left: 3px solid var(--accent);
}
.vja-art-body .callout .lbl {
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 10px;
}
.vja-art-body .callout p { font-size: 18px; line-height: 1.55; margin: 0; }
.vja-art-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 26px 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: 17px;
}
.vja-art-body table thead th {
  text-align: left;
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-mute);
  padding: 12px 14px 12px 0;
  border-bottom: 1px solid var(--ink);
}
.vja-art-body table tbody td {
  padding: 12px 14px 12px 0;
  border-bottom: 1px solid var(--rule);
  color: var(--ink-2);
}
.vja-art-body table tbody td:first-child {
  font-weight: 600;
  color: var(--ink);
}
.vja-art-body .expert {
  margin: 36px 0;
  padding: 26px;
  border: 1px solid var(--rule);
  background: var(--paper);
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 18px;
  position: relative;
}
.vja-art-body .expert .av { width: 64px; height: 64px; border-radius: 50%; }
.vja-art-body .expert q {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 19px;
  line-height: 1.5;
  color: var(--ink);
  display: block;
}
.vja-art-body .expert q::before, .vja-art-body .expert q::after { content: ""; }
.vja-art-body .expert .who {
  margin-top: 12px;
  font-family: 'Manrope', sans-serif;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  font-weight: 700;
}
.vja-art-body .photo-pair {
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
  margin: 28px 0;
}
.vja-art-body .photo-pair .ph {
  background-image: repeating-linear-gradient(135deg, #cbb892 0, #cbb892 8px, #b9a378 8px, #b9a378 16px);
  aspect-ratio: 4/3;
  display: flex; align-items: center; justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
  color: rgba(40,28,16,0.55);
}

/* ---------- TOC sidebar ---------- */
.vja-art-toc { position: sticky; top: 20px; }
.vja-art-toc .search {
  display: flex; align-items: center; gap: 10px;
  border: 1px solid var(--rule);
  padding: 12px 18px;
  background: var(--paper);
  color: var(--ink-mute);
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 16px;
  margin-bottom: 24px;
}
.vja-art-toc h4 {
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  letter-spacing: 0.24em;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 16px;
}
.vja-art-toc ol { list-style: none; padding: 0; margin: 0; counter-reset: t; }
.vja-art-toc li {
  counter-increment: t;
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--rule);
  align-items: baseline;
  cursor: pointer;
}
.vja-art-toc li::before {
  content: counter(t, decimal-leading-zero);
  font-family: 'Manrope', sans-serif;
  font-size: 11px;
  letter-spacing: 0.12em;
  font-weight: 700;
  color: var(--accent);
  padding-top: 2px;
}
.vja-art-toc li .t {
  font-family: 'Cormorant Garamond', serif;
  font-size: 17px;
  line-height: 1.25;
  color: var(--ink);
}
.vja-art-toc li.active { background: rgba(122,42,42,0.04); }
.vja-art-toc li.active .t { color: var(--accent); font-style: italic; }
.vja-art-toc .progress {
  margin-top: 22px;
  padding: 18px;
  border: 1px solid var(--rule);
  background: var(--paper-2);
}
.vja-art-toc .progress .bar {
  height: 3px; background: var(--rule); margin: 12px 0 8px;
  position: relative;
}
.vja-art-toc .progress .bar .fill {
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 33%; background: var(--accent);
}
.vja-art-toc .progress .lbl {
  display: flex; justify-content: space-between;
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-mute);
}

/* ---------- Related articles ---------- */
.vja-art-related {
  background: var(--paper-2);
  padding: 70px 60px;
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
}
.vja-art-related .head {
  display: grid; grid-template-columns: auto 1fr auto auto; gap: 26px;
  align-items: end;
  margin-bottom: 40px;
}
.vja-art-related h2 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500; font-size: 48px;
  line-height: 1; letter-spacing: -0.02em;
  margin: 0;
}
.vja-art-related h2 .em { font-style: italic; color: var(--accent); }
.vja-art-related .rule-fill { height: 1px; background: var(--rule); margin-bottom: 14px; }
.vja-art-related .all {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic; color: var(--accent);
  font-size: 17px;
  border-bottom: 1px solid var(--accent);
  padding-bottom: 1px;
}
.vja-art-related .grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px;
}
.vja-art-related .card {
  display: flex; flex-direction: column;
}
.vja-art-related .card .ph {
  aspect-ratio: 16/10;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
}
.vja-art-related .card .ph .code {
  position: absolute;
  left: 14px; bottom: 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.9);
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
.vja-art-related .card .meta {
  display: flex; gap: 14px;
  font-family: 'Manrope', sans-serif;
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink-mute);
  margin-bottom: 8px;
}
.vja-art-related .card h3 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 22px;
  line-height: 1.15;
  margin: 0 0 8px;
}
.vja-art-related .card p {
  font-family: 'Manrope', sans-serif;
  font-size: 13px;
  line-height: 1.55;
  color: var(--ink-mute);
  margin: 0;
}

/* ---------- Author bio ---------- */
.vja-art-bio {
  padding: 80px 60px;
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 40px;
  align-items: start;
  border-bottom: 1px solid var(--rule);
}
.vja-art-bio .av { width: 120px; height: 120px; border-radius: 50%; }
.vja-art-bio h3 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 32px;
  margin: 0 0 8px;
}
.vja-art-bio .role {
  font-family: 'Manrope', sans-serif;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  font-weight: 700;
  margin-bottom: 18px;
}
.vja-art-bio p {
  font-family: 'Cormorant Garamond', serif;
  font-size: 19px;
  line-height: 1.55;
  color: var(--ink-2);
  margin: 0 0 16px;
  max-width: 720px;
}
.vja-art-bio .more {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  color: var(--accent);
  font-size: 17px;
  border-bottom: 1px solid var(--accent);
  padding-bottom: 1px;
}
`;

function ArticleJournal() {
  React.useEffect(() => {
    if (!document.getElementById("vja-style") && window.VJA_CSS) {
      const s = document.createElement("style");
      s.id = "vja-style";
      s.textContent = window.VJA_CSS;
      document.head.appendChild(s);
    }
    if (!document.getElementById("vja-art-style")) {
      const s2 = document.createElement("style");
      s2.id = "vja-art-style";
      s2.textContent = VJA_ART_CSS;
      document.head.appendChild(s2);
    }
  }, []);

  const toc = [
    "Регионы выращивания кофе в Индии",
    "Виды и сорта индийского кофе: арабика и робуста",
    "История кофе в Индии: от Баба Будана до наших дней",
    "Кофейные плантации и занятость в индийской отрасли",
    "Как выращивают и обрабатывают кофе в Индии",
    "Чем уникален индийский кофе",
    "Экспорт индийского кофе и внутренний рынок",
    "Проблемы кофейной индустрии Индии",
    "Главный индийский кофейный бренд",
  ];

  return (
    <div className="vja vja-article">
      {/* Masthead (reused styling) */}
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
        <a><span className="num">II</span>Как готовить</a>
        <a><span className="num">III</span>Рецепты</a>
        <a><span className="num">IV</span>Полезно знать</a>
        <a className="active"><span className="num">V</span>По странам</a>
      </nav>

      {/* Breadcrumbs */}
      <div className="vja-art-crumbs">
        <span className="home">⌂</span>
        <a>Главная</a>
        <span className="sep">›</span>
        <a>По странам</a>
        <span className="sep">›</span>
        <span className="cur">Индия</span>
      </div>

      {/* Article header */}
      <header className="vja-art-header">
        <div className="kicker">
          <span style={{
            fontFamily:"'Manrope',sans-serif",
            fontSize:11,fontWeight:700,letterSpacing:"0.22em",
            textTransform:"uppercase",color:"var(--accent)",
          }}>География · Азия</span>
          <span className="sep"></span>
          <span style={{
            fontFamily:"'Manrope',sans-serif",
            fontSize:11,fontWeight:600,letterSpacing:"0.16em",
            textTransform:"uppercase",color:"var(--ink-mute)",
          }}>Большое исследование номера</span>
        </div>
        <h1>
          Кофе в&nbsp;Индии: история, регионы, сорта <span className="em">Monsooned Malabar</span> и&nbsp;Mysore
        </h1>
        <p className="deck">
          Страна, где зерно три месяца дышит юго-западным муссоном&nbsp;— и&nbsp;превращается из&nbsp;зелёного в&nbsp;медовое, а&nbsp;кислотность уходит в&nbsp;ноль.
        </p>

        <div className="byline-row">
          <div className="author">
            <PhotoPH w={54} h={54} radius="50%" bg="#c8a78a" bg2="#a8866b" label=" " />
            <div>
              <div className="name">Таисия Жукова</div>
              <div className="role">Эксперт по странам-производителям</div>
            </div>
          </div>
          <div className="meta-info">
            <div className="li first">22 августа 2025 г.</div>
            <div className="li">обновлено 22 мая 2026 г.</div>
            <div className="li">25 мин чтения</div>
            <div className="li">6 042 прочтения</div>
          </div>
          <div className="share">
            <div className="ic">→</div>
            <div className="ic">vk</div>
            <div className="ic">tg</div>
            <div className="ic">♡</div>
          </div>
        </div>
      </header>

      {/* Hero figure */}
      <figure className="vja-art-figure">
        <div className="ph-frame">
          <div className="stamp">Plate I · Карнатака, Чикмагалур</div>
          <div className="ph-msg">
            <span className="big">Плантация на склоне</span>
            wide image · hero photo · ~ 1160 × 580
          </div>
        </div>
        <figcaption className="cap">
          <span className="it">Кофейные террасы региона Чикмагалур, штат Карнатака.</span>
          <span>Фото: Анна Зернова · 2024 г.</span>
        </figcaption>
      </figure>

      {/* Country fact panel */}
      <section className="vja-art-fact">
        {/* Left — pastel-tinted fact table */}
        <div className="specs">
          <h4>Основные сведения</h4>
          <ul>
            <li className="t1"><span className="k">Место в мире</span><span className="v"><span className="em">6-е</span></span></li>
            <li className="t2"><span className="k">Доля на рынке</span><span className="v">4,5&nbsp;%</span></li>
            <li className="t3"><span className="k">Основные виды</span><span className="v">Арабика 40%, Робуста 60%</span></li>
            <li className="t4"><span className="k">Обработка</span><span className="v">Сухой, влажный, <span className="em">муссонный</span></span></li>
            <li className="t5"><span className="k">Сезон сбора</span><span className="v">Ноябрь — март</span></li>
            <li className="t6"><span className="k">Объём, год</span><span className="v">350&nbsp;тыс. тонн</span></li>
          </ul>
        </div>

        {/* Middle — key takeaways as bullets (max 3) */}
        <div className="keys">
          <h4>Главное о&nbsp;стране</h4>
          <ul>
            <li className="acc"><span className="t"><span className="strong">Индия — 6-я</span> в&nbsp;мире и&nbsp;3-я в&nbsp;Азии по&nbsp;производству кофе.</span></li>
            <li><span className="t">Единственная страна с&nbsp;<span className="em">муссонной</span> обработкой — сорт Monsooned Malabar.</span></li>
            <li className="acc"><span className="t">Редкий случай: <span className="strong">робусты больше, чем&nbsp;арабики</span> — 60% против 40%.</span></li>
          </ul>
        </div>

        {/* Right — country widget with region map */}
        <div className="widget">
          <div className="head">
            <h3 className="country-name">Индия</h3>
            <div className="tagline">Лидер муссонной обработки</div>
          </div>
          <div className="map" aria-label="Карта Индии в Южной Азии">
            {/* Stylized India outline + neighbouring south-asia hint */}
            <svg viewBox="0 0 140 180" fill="none" aria-hidden="true">
              {/* Faint surrounding region */}
              <path d="M22 24 L40 18 L62 16 L82 18 L98 24 L110 36 L116 52 L112 70 L104 84 L96 92 L88 100 L92 116 L100 132 L96 148 L88 158 L72 162 L60 156 L48 144 L40 128 L34 112 L28 96 L24 78 L20 58 L18 40 Z"
                    fill="rgba(34,26,20,0.06)" />
              {/* India outline (stylized) */}
              <path d="M50 30 L62 26 L74 28 L84 34 L92 44 L96 56 L94 68 L88 78 L82 86 L78 96 L80 110 L84 124 L80 140 L72 152 L62 156 L52 150 L46 138 L42 124 L40 108 L42 92 L46 76 L46 60 L48 44 Z"
                    fill="var(--accent)"
                    stroke="var(--accent)"
                    strokeWidth="0.5" />
              {/* Marker — main coffee region (south) */}
              <circle cx="62" cy="130" r="3" fill="var(--paper)" stroke="var(--accent)" strokeWidth="1.5" />
            </svg>
            <span className="region-lbl">Южная Азия</span>
          </div>
          <div className="side">
            <div>
              <div className="lbl">В мире</div>
              <div className="val big">№&nbsp;6</div>
            </div>
            <div>
              <div className="lbl">Доля рынка</div>
              <div className="val big">4,5&nbsp;%</div>
            </div>
            <div>
              <div className="lbl">Главный сорт</div>
              <div className="val">Monsooned Malabar</div>
            </div>
          </div>
        </div>
      </section>

      {/* Body + TOC */}
      <section className="vja-art-body">
        <div className="body">
          <p className="lede">
            <strong>Кофе в&nbsp;Индии</strong> появился в&nbsp;XVI&nbsp;веке и&nbsp;сегодня даёт стране <strong>6-е место в&nbsp;мире</strong> по&nbsp;объёмам производства и&nbsp;<strong>3-е место среди стран Азии</strong>. Ежегодный сбор — около 350&nbsp;тысяч тонн зерна, доля Индии на&nbsp;мировом кофейном рынке — 4,5&nbsp;%.
          </p>
          <p>
            70–80&nbsp;% урожая идёт на&nbsp;экспорт: главные покупатели — Италия (20&nbsp;%), Германия (12&nbsp;%) и&nbsp;Бельгия (8&nbsp;%), Россия закупает около 5&nbsp;%.
          </p>
          <p>
            В&nbsp;индийской кофейной отрасли занято свыше <strong>2&nbsp;миллионов человек</strong>, включая 250&nbsp;тысяч мелких фермеров. 98&nbsp;% хозяйств имеют площадь менее 10&nbsp;гектаров. На&nbsp;175&nbsp;тысячах кофейных ферм Индии выращивают <span className="accent">арабику (40&nbsp;%) и&nbsp;робусту (60&nbsp;%)</span> — редкий случай, когда робусты больше, чем арабики.
          </p>
          <p>
            В&nbsp;российских спешелти-магазинах индийский кофе продают под брендами <strong>Monsooned Malabar</strong>, <strong>Mysore Nuggets Extra Bold</strong> и&nbsp;<strong>Plantation AA</strong>. Цена за&nbsp;250&nbsp;г — 500–1500&nbsp;₽ в&nbsp;зависимости от&nbsp;сорта и&nbsp;категории.
          </p>

          <h2 id="regiony"><span className="num">Глава 01</span>Регионы выращивания кофе в&nbsp;Индии</h2>

          <p>
            Большая часть индийского кофе растёт в&nbsp;южных штатах, где климат тёплый и&nbsp;влажный, а&nbsp;почвы богаты органикой. С&nbsp;1990-х кофейные плантации появились и&nbsp;в&nbsp;северо-восточных штатах — Аруначал-Прадеш, Ассам, Манипур, — но&nbsp;их&nbsp;доля пока невелика.
          </p>

          <figure>
            <div className="ph">[ photo · карта регионов с&nbsp;цветным выделением штатов ]</div>
            <figcaption>
              Традиционные кофейные штаты — Карнатака, Керала и&nbsp;Тамилнад дают около 95&nbsp;% урожая.
              <span className="cred">Источник: Coffee Board of India, 2024</span>
            </figcaption>
          </figure>

          <blockquote className="pull">
            На&nbsp;Карнатаку приходится больше 70&nbsp;% всего индийского кофе&nbsp;— и&nbsp;именно её&nbsp;Чикмагалур считают сердцем индустрии.
          </blockquote>

          <h3>Карнатака — сердце индустрии</h3>
          <p>
            Чикмагалур, Кодагу и&nbsp;Хассан — три ключевых района Карнатаки. Высота от&nbsp;1000 до&nbsp;1500&nbsp;м, осадки 1500–2500&nbsp;мм в&nbsp;год, тень от&nbsp;серебристых дубов и&nbsp;грэвильи. Здесь же расположена ферма Баба Будана — символическое место рождения индийского кофе.
          </p>

          <table>
            <thead>
              <tr><th>Штат</th><th>Доля урожая</th><th>Высота</th><th>Ключевые сорта</th></tr>
            </thead>
            <tbody>
              <tr><td>Карнатака</td><td>71&nbsp;%</td><td>900–1500 м</td><td>S795, Kent, Cauvery</td></tr>
              <tr><td>Керала</td><td>21&nbsp;%</td><td>600–1200 м</td><td>Робуста CxR, S274</td></tr>
              <tr><td>Тамилнад</td><td>5&nbsp;%</td><td>800–1800 м</td><td>Арабика SLN&nbsp;9, Cauvery</td></tr>
              <tr><td>Северо-восток</td><td>3&nbsp;%</td><td>~800 м</td><td>экспериментальные сорта</td></tr>
            </tbody>
          </table>

          <div className="callout">
            <div className="lbl">☕ Полезно знать</div>
            <p>
              Карнатакский Чикмагалур — единственный регион Индии, где сохранилась плантация святого Баба Будана. Семь зёрен, привезённых им&nbsp;из&nbsp;Йемена, до&nbsp;сих пор символически считают «материнской линией» индийской арабики.
            </p>
          </div>

          <h2 id="vidy"><span className="num">Глава 02</span>Виды и&nbsp;сорта: арабика и&nbsp;робуста</h2>

          <p>
            В&nbsp;отличие от&nbsp;Колумбии или Эфиопии, в&nbsp;Индии доминирует робуста. Это вопрос климата: на&nbsp;высотах до&nbsp;800&nbsp;м арабика страдает от&nbsp;ржавчинного грибка, а&nbsp;робуста чувствует себя отлично. На&nbsp;высокогорье&nbsp;— наоборот, арабика даёт чашку, ради которой стоит платить за&nbsp;250&nbsp;г 1200–1500&nbsp;₽.
          </p>

          <div className="photo-pair">
            <div className="ph">[ зерно арабики · крупно · ~520 × 390 ]</div>
            <div className="ph">[ зерно робусты · крупно · ~520 × 390 ]</div>
          </div>

          <div className="expert">
            <PhotoPH w={64} h={64} radius="50%" bg="#c8a78a" bg2="#a8866b" label=" " />
            <div>
              <q>Индийский Monsooned Malabar — единственный в&nbsp;мире кофе, который намеренно теряет кислотность. Если вы&nbsp;любите сладость карамели и&nbsp;тёмный шоколад без&nbsp;цитруса — ищите именно его.</q>
              <div className="who">Максим Сметанин · Q-grader, 8&nbsp;лет каппинга</div>
            </div>
          </div>

          <h3>Премиальные сорта</h3>
          <p>
            <strong>Mysore Nuggets Extra Bold</strong>&nbsp;— крупнозернистая арабика с&nbsp;нотами какао и&nbsp;цветочного мёда. <strong>Plantation AA</strong>&nbsp;— классическая мытая обработка, тело средней плотности, сбалансированная кислотность.
            А&nbsp;вот <span className="accent">Monsooned Malabar</span> &mdash; история отдельная: зерно три месяца «отдыхает» под юго-западным муссоном, набухает, теряет кислотность и&nbsp;становится медовым.
          </p>

          <p>
            Это последний и&nbsp;единственный «случайный» сорт мирового кофе&nbsp;— муссонная обработка появилась как побочный эффект морских перевозок XIX&nbsp;века, когда зерно в&nbsp;деревянных трюмах менялось в&nbsp;цвете и&nbsp;аромате за&nbsp;время пути в&nbsp;Лондон.
          </p>
        </div>

        <aside className="vja-art-toc">
          <div className="search">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="m11 11 4 4"/></svg>
            <span>Поиск по сайту…</span>
          </div>
          <h4>Содержание</h4>
          <ol>
            {toc.map((t, i) => (
              <li key={i} className={i === 0 ? "active" : ""}>
                <span className="t">{t}</span>
              </li>
            ))}
          </ol>
          <div className="progress">
            <div className="lbl"><span>Прогресс</span><span>33&nbsp;%</span></div>
            <div className="bar"><div className="fill"></div></div>
            <div className="lbl"><span>Глава 01 / 09</span><span>~17 мин осталось</span></div>
          </div>
        </aside>
      </section>

      {/* Author bio */}
      <section className="vja-art-bio">
        <PhotoPH w={120} h={120} radius="50%" bg="#c8a78a" bg2="#a8866b" label=" " />
        <div>
          <div className="role">Об&nbsp;авторе</div>
          <h3>Таисия Жукова</h3>
          <p>
            10&nbsp;лет в&nbsp;кофейной журналистике. Объехала плантации Эфиопии, Колумбии, Индии и&nbsp;Кении. Пишет о&nbsp;странах-производителях, географии вкуса и&nbsp;экономике кофе. Автор 47&nbsp;материалов в&nbsp;альманахе «Все кофе».
          </p>
          <a className="more">Все материалы Таисии →</a>
        </div>
      </section>

      {/* Related */}
      <section className="vja-art-related">
        <div className="head">
          <h2>Читайте также <span className="em">— страны мира</span></h2>
          <div className="rule-fill"></div>
          <div style={{display:'flex', gap: 8, alignItems:'center', fontFamily:"'Manrope',sans-serif", fontSize: 11, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--ink-mute)', marginBottom: 6}}>
            <button className="vja-arrow lg" aria-label="Назад">‹</button>
            <span style={{padding:'0 6px'}}>1 / 4</span>
            <button className="vja-arrow lg" aria-label="Вперёд">›</button>
          </div>
          <a className="all">Все страны-производители →</a>
        </div>
        <div className="grid">
          {[
            { code: "ET", tag: "История", country: "Эфиопия", title: "Кофе в Эфиопии: родина арабики", blurb: "Леса Каффы, наследие пастуха Калди и&nbsp;94 культивара на&nbsp;генетической карте.", cover: "linear-gradient(135deg, #d97a4a 0%, #6d2a12 100%)" },
            { code: "KE", tag: "География", country: "Кения", title: "Кофе в Кении: SL28 и&nbsp;аукцион в Найроби", blurb: "Колониальные плантации, ноты чёрной смородины и&nbsp;экспортная вертикаль.", cover: "linear-gradient(135deg, #b66440 0%, #4a1a0a 100%)" },
            { code: "TZ", tag: "Индустрия", country: "Танзания", title: "Кофе в Танзании: склоны Килиманджаро", blurb: "Кооперативы AA и&nbsp;FAQ, аукционы Моши и&nbsp;объём 60&nbsp;тыс. тонн в год.", cover: "linear-gradient(135deg, #c2855a 0%, #5a2810 100%)" },
          ].map((c, i) => (
            <article className="card" key={i}>
              <div className="ph" style={{ background: c.cover }}>
                <span className="code">{c.code}</span>
              </div>
              <div className="meta">
                <span style={{color:'var(--accent)', fontWeight: 700}}>{c.code}</span>
                <span>{c.tag}</span>
                <span>{c.country}</span>
              </div>
              <h3>{c.title}</h3>
              <p dangerouslySetInnerHTML={{__html: c.blurb}} />
            </article>
          ))}
        </div>
      </section>

      {/* Footer (reused) */}
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
              <li>Как готовить</li>
              <li>Рецепты</li>
              <li>Полезно знать</li>
              <li>По странам</li>
            </ul>
          </div>
          <div>
            <h4>Полезное</h4>
            <ul>
              <li>О нас</li>
              <li>Политика конфиденциальности</li>
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

window.ArticleJournal = ArticleJournal;
