// Variant A — "Редакция" / Editorial Journal
// Warm paper, deep espresso ink, oxblood accent.
// Cormorant Garamond display + Manrope body.

const VJA_CSS = `
.vja {
  --paper: #f4eee2;
  --paper-2: #ece3d0;
  --ink: #221a14;
  --ink-2: #3d2f25;
  --ink-mute: rgba(34,26,20,0.55);
  --rule: rgba(34,26,20,0.18);
  --accent: #7a2a2a;
  --accent-2: #a04a3a;
  --teal: #19a7c2;
  --teal-soft: rgba(25,167,194,0.18);
  background: var(--paper);
  color: var(--ink);
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.55;
  width: 1280px;
  position: relative;
  overflow: hidden;
}
.vja * { box-sizing: border-box; }
.vja .serif { font-family: 'Cormorant Garamond', 'EB Garamond', serif; font-weight: 500; }
.vja .it { font-style: italic; }
.vja .kicker {
  font-family: 'Manrope', sans-serif;
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--accent);
}
.vja .meta {
  font-family: 'Manrope', sans-serif;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-mute);
  font-weight: 500;
}
.vja .wrap { max-width: 1140px; margin: 0 auto; padding: 0 60px; }

/* ---------- Masthead ---------- */
.vja-masthead {
  border-bottom: 1px solid var(--rule);
  padding: 22px 60px 18px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 30px;
}
.vja-masthead .brand { display: flex; align-items: center; gap: 12px; }
.vja-masthead .brand-text { display: flex; align-items: baseline; gap: 14px; }
.vja-masthead .brand .name {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 34px;
  letter-spacing: -0.01em;
  line-height: 1;
}
.vja-masthead .brand .name .em { font-style: italic; color: var(--accent); font-weight: 500; }
.vja-masthead .brand .tag {
  font-size: 10px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--ink-mute);
}
.vja-masthead .right { display: flex; justify-content: flex-end; gap: 18px; align-items: center; }
.vja-masthead .search {
  display: flex; align-items: center; gap: 8px;
  border-bottom: 1px solid var(--ink); padding: 4px 0;
  width: 200px; color: var(--ink-mute);
}
.vja-masthead .search svg { width: 13px; height: 13px; }
.vja-masthead .search span { font-size: 12px; letter-spacing: 0.04em; }
.vja-masthead .soc { display: flex; gap: 12px; color: var(--ink-mute); }
.vja-masthead .soc a { color: inherit; }

/* ---------- Nav ---------- */
.vja-nav {
  border-bottom: 1px solid var(--rule);
  padding: 14px 60px;
  display: flex; justify-content: center; gap: 56px;
}
.vja-nav a {
  font-family: 'Cormorant Garamond', serif;
  font-size: 19px;
  color: var(--ink);
  text-decoration: none;
  position: relative;
}
.vja-nav a.active { font-style: italic; color: var(--accent); }
.vja-nav a .num {
  font-family: 'Manrope', sans-serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--ink-mute);
  margin-right: 6px;
  vertical-align: super;
}

/* ---------- Hero ---------- */
.vja-hero {
  padding: 80px 60px 60px;
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 60px;
  align-items: start;
  border-bottom: 1px solid var(--rule);
}
.vja-hero .h1 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  font-size: 74px;
  line-height: 0.98;
  letter-spacing: -0.025em;
  margin: 0;
}
.vja-hero .h1 .for {
  font-style: italic;
  font-weight: 400;
  color: var(--accent);
  display: block;
  margin-top: 4px;
}
.vja-hero .lede {
  font-family: 'Cormorant Garamond', serif;
  font-size: 21px;
  line-height: 1.45;
  font-style: italic;
  color: var(--ink-2);
  margin: 26px 0 0;
  max-width: 520px;
}
.vja-hero .credit {
  margin-top: 26px;
  display: flex; gap: 10px; align-items: center;
}
.vja-hero .credit-dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--accent);
}
/* Hero art — uses the brand collage image */
.vja-hero .art {
  position: relative;
  width: 100%;
}
.vja-hero .art .frame {
  position: relative;
  width: 100%;
  aspect-ratio: 572 / 600;
  display: flex; align-items: center; justify-content: center;
}
.vja-hero .art .frame::before {
  content: "";
  position: absolute;
  left: 8%; top: 6%;
  width: 84%; height: 84%;
  border: 1px solid var(--rule);
  border-radius: 50%;
  pointer-events: none;
}
.vja-hero .art img {
  width: 100%;
  height: auto;
  display: block;
  position: relative;
  z-index: 1;
}
.vja-hero .art .badge {
  position: absolute;
  left: -10px; top: 20px;
  z-index: 2;
  background: var(--ink);
  color: var(--paper);
  padding: 8px 14px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  display: inline-flex; gap: 8px; align-items: center;
}
.vja-hero .art .badge .dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--teal);
}
.vja-hero .art .caption {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--rule);
  display: flex; justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--ink-mute);
}
.vja-hero .art .caption .it {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 15px;
  text-transform: none;
  letter-spacing: 0;
  color: var(--ink);
}

/* ---------- Stats ---------- */
.vja-stats {
  padding: 60px 60px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  border-bottom: 1px solid var(--rule);
}
.vja-stats .stat {
  padding: 0 40px;
  border-left: 1px solid var(--rule);
}
.vja-stats .stat:first-child { border-left: none; padding-left: 0; }
.vja-stats .num {
  font-family: 'Cormorant Garamond', serif;
  font-size: 88px;
  line-height: 1;
  font-weight: 400;
  letter-spacing: -0.04em;
  color: var(--ink);
}
.vja-stats .num .unit {
  font-size: 22px;
  font-style: italic;
  margin-left: 4px;
  color: var(--accent);
  vertical-align: top;
  font-weight: 400;
}
.vja-stats .desc {
  font-family: 'Manrope', sans-serif;
  font-size: 13px;
  line-height: 1.45;
  color: var(--ink-mute);
  margin-top: 16px;
  max-width: 240px;
}

/* ---------- Triptych: Popular / FAQ / Tip ---------- */
.vja-tript {
  padding: 60px 60px;
  display: grid;
  grid-template-columns: 1.1fr 1fr 0.9fr;
  gap: 50px;
  border-bottom: 1px solid var(--rule);
}
.vja-tript .col h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 30px;
  font-weight: 600;
  line-height: 1.1;
  margin: 14px 0 22px;
}
.vja-tript .col h2 .em { font-style: italic; color: var(--accent); }
.vja-tript .col h2 .num-tag {
  display: block;
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  letter-spacing: 0.3em;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 12px;
}
.vja-pop .pop-img {
  margin-bottom: 18px;
}
.vja-pop h3 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 8px;
  line-height: 1.2;
}
.vja-pop .blurb {
  font-size: 13.5px;
  color: var(--ink-2);
  line-height: 1.55;
}
/* Round arrow controls used in carousels and section heads */
.vja-arrow {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 1px solid var(--rule);
  background: var(--paper);
  color: var(--ink);
  display: inline-flex; align-items: center; justify-content: center;
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  padding: 0 0 2px;
  transition: border-color .2s ease, color .2s ease, background .2s ease;
}
.vja-arrow:hover { border-color: var(--accent); color: var(--accent); }
.vja-arrow.lg { width: 42px; height: 42px; font-size: 26px; }

/* Popular slider — arrow nav row in kicker */
.vja-pop .nav {
  display: flex; align-items: center; gap: 10px;
  font-family: 'Manrope', sans-serif;
  font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--ink-mute);
}
.vja-pop .nav .count { min-width: 36px; text-align: center; }
.vja-pop .controls {
  margin-top: 18px;
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid var(--rule);
  padding-top: 14px;
}
.vja-pop .read {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 16px;
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid var(--accent);
  padding-bottom: 1px;
}
.vja-pop .pager {
  font-family: 'Manrope', sans-serif;
  font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--ink-mute);
  display: flex; gap: 14px; align-items: center;
}
.vja-pop .pager .dots { display: flex; gap: 4px; }
.vja-pop .pager .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--rule); }
.vja-pop .pager .dot.on { background: var(--accent); }
.vja-faq .faq-img {
  position: relative;
  width: 84px; height: 84px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 4px;
  box-shadow: 0 6px 16px rgba(34,26,20,0.12);
}
.vja-faq .faq-img img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
  filter: saturate(1.05);
}
.vja-faq ul { list-style: none; padding: 0; margin: 0; }
.vja-faq li {
  border-bottom: 1px solid var(--rule);
  padding: 14px 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px;
  display: flex; gap: 14px; align-items: baseline;
  cursor: pointer;
}
.vja-faq li .qn {
  font-family: 'Manrope', sans-serif;
  font-size: 10px; letter-spacing: 0.16em;
  font-weight: 700; color: var(--accent);
  flex: 0 0 24px;
}
.vja-faq li .ar {
  margin-left: auto;
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 18px;
  color: var(--ink-mute);
}
.vja-tip {
  background: var(--ink);
  color: var(--paper);
  padding: 32px 30px;
  position: relative;
}
.vja-tip .kicker { color: var(--accent-2); }
.vja-tip h2 { color: var(--paper); margin: 14px 0 18px; }
.vja-tip p {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 19px;
  line-height: 1.5;
  margin: 0 0 22px;
  color: rgba(244,238,226,0.92);
}
.vja-tip .swap {
  font-family: 'Manrope', sans-serif;
  font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
  color: rgba(244,238,226,0.7);
  border: 1px solid rgba(244,238,226,0.3);
  padding: 10px 16px;
  display: inline-flex; align-items: center; gap: 8px;
  cursor: pointer;
}

/* ---------- Updates section ---------- */
.vja-sec-head {
  padding: 80px 60px 30px;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: end;
  gap: 26px;
}
.vja-sec-head .nav {
  display: flex; gap: 8px; align-items: center;
  margin-bottom: 6px;
  padding-right: 12px;
  border-right: 1px solid var(--rule);
  font-family: 'Manrope', sans-serif;
  font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--ink-mute);
}
.vja-sec-head .nav .count { padding: 0 6px; }
.vja-sec-head h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 56px;
  line-height: 1;
  font-weight: 500;
  letter-spacing: -0.02em;
  margin: 0;
}
.vja-sec-head h2 .em { font-style: italic; color: var(--accent); font-weight: 400; }
.vja-sec-head .rule-fill { height: 1px; background: var(--rule); margin-bottom: 18px; }
.vja-sec-head .all {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 17px;
  color: var(--ink-mute);
  margin-bottom: 6px;
}
.vja-updates {
  padding: 30px 60px 60px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 28px;
  border-bottom: 1px solid var(--rule);
}
.vja-card .img-wrap { position: relative; margin-bottom: 18px; }
.vja-card .img-wrap .num {
  position: absolute; top: 12px; left: 12px;
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 22px;
  color: var(--accent);
  background: var(--paper);
  border: 1px solid var(--rule);
  width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  letter-spacing: -0.02em;
  padding-top: 1px;
}
.vja-card .meta-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
.vja-card h3 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  line-height: 1.15;
  font-weight: 600;
  margin: 0 0 10px;
}
.vja-card p {
  font-size: 13px;
  line-height: 1.5;
  color: var(--ink-mute);
  margin: 0 0 14px;
}
.vja-card .read {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 15px;
  color: var(--accent);
}

/* ---------- About + Reading now ---------- */
.vja-about {
  padding: 70px 60px;
  display: grid;
  grid-template-columns: 1fr 0.9fr 320px;
  gap: 50px;
  border-bottom: 1px solid var(--rule);
  align-items: start;
}
.vja-about .visual {
  position: relative;
  align-self: stretch;
  min-height: 480px;
  background: transparent;
  border: 0;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.vja-about .visual::before {
  content: none;
}
.vja-about .visual img {
  position: relative;
  z-index: 1;
  max-width: 92%;
  max-height: 100%;
  width: auto;
  display: block;
}
.vja-about .visual .v-caption {
  position: absolute;
  left: 16px; bottom: 14px; right: 16px;
  display: flex; justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink-mute);
}
.vja-about .kicker { margin-bottom: 18px; }
.vja-about h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 48px;
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.015em;
  margin: 0 0 20px;
}
.vja-about h2 .em { font-style: italic; color: var(--accent); }
.vja-about .col p {
  font-family: 'Cormorant Garamond', serif;
  font-size: 19px;
  line-height: 1.55;
  color: var(--ink-2);
  margin: 0 0 14px;
}
.vja-about .col p:first-of-type::first-letter {
  font-size: 64px;
  font-weight: 600;
  float: left;
  line-height: 0.9;
  margin: 6px 8px 0 0;
  color: var(--accent);
}
.vja-about .reading h3 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--rule);
}
.vja-about .reading ol { list-style: none; padding: 0; margin: 0; counter-reset: r; }
.vja-about .reading li {
  counter-increment: r;
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--rule);
  align-items: start;
}
.vja-about .reading li::before {
  content: counter(r, decimal-leading-zero);
  font-family: 'Manrope', sans-serif;
  font-size: 11px;
  letter-spacing: 0.12em;
  font-weight: 700;
  color: var(--accent);
  padding-top: 4px;
}
.vja-about .reading li .title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.25;
  color: var(--ink);
}
.vja-about .reading li .cat {
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-mute);
  margin-top: 6px;
}

/* ---------- Editors / authors ---------- */
.vja-eds {
  padding: 80px 60px;
  background: var(--paper-2);
}
.vja-eds .top { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-bottom: 50px; }
.vja-eds h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 56px;
  line-height: 1;
  font-weight: 500;
  margin: 0;
}
.vja-eds h2 .em { font-style: italic; color: var(--accent); }
.vja-eds .blurb {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 22px;
  line-height: 1.5;
  color: var(--ink-2);
  margin: 0;
}
.vja-eds .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
.vja-eds .ed-card {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 18px;
  align-items: start;
}
.vja-eds .ed-card .av {
  width: 80px; height: 80px; border-radius: 50%;
}
.vja-eds .ed-card .name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.1;
  margin-bottom: 4px;
}
.vja-eds .ed-card .role {
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 10px;
}
.vja-eds .ed-card .topic {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 16px;
  line-height: 1.4;
  color: var(--ink-mute);
}

/* ---------- Footer ---------- */
.vja-foot {
  background: var(--ink);
  color: rgba(244,238,226,0.9);
  padding: 70px 60px 30px;
}
.vja-foot .top {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
  gap: 50px;
  border-bottom: 1px solid rgba(244,238,226,0.15);
  padding-bottom: 40px;
}
.vja-foot h4 {
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--accent-2);
  margin: 0 0 18px;
}
.vja-foot ul { list-style: none; padding: 0; margin: 0; }
.vja-foot li { padding: 6px 0; font-family: 'Cormorant Garamond', serif; font-size: 18px; }
.vja-foot .brand .lockup {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 14px;
}
.vja-foot .brand .n {
  font-family: 'Cormorant Garamond', serif;
  font-size: 36px;
  font-weight: 600;
  line-height: 1;
}
.vja-foot .brand .n .em { font-style: italic; color: var(--accent-2); font-weight: 500; }
.vja-foot .brand p {
  font-size: 13px; line-height: 1.55; color: rgba(244,238,226,0.6); margin: 0 0 16px;
}
.vja-foot .news input {
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(244,238,226,0.25);
  color: var(--paper);
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 17px;
  padding: 8px 0;
  width: 100%;
  outline: none;
}
.vja-foot .news .btn {
  margin-top: 14px;
  font-family: 'Manrope', sans-serif;
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--paper);
  background: var(--accent);
  padding: 12px 20px;
  display: inline-flex; align-items: center; gap: 8px;
}
.vja-foot .bottom {
  padding-top: 26px;
  display: flex; justify-content: space-between;
  font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(244,238,226,0.5);
}

/* ---------- Decorative ornament ---------- */
.vja-orn {
  display: flex; justify-content: center; align-items: center; gap: 14px;
  padding: 12px 0;
  color: var(--accent);
}
.vja-orn .l { width: 60px; height: 1px; background: var(--accent); opacity: 0.4; }
`;

function VariantJournal() {
  React.useEffect(() => {
    if (document.getElementById("vja-style")) return;
    const s = document.createElement("style");
    s.id = "vja-style";
    s.textContent = VJA_CSS;
    document.head.appendChild(s);
  }, []);

  const featured = {
    title: "История кофе",
    sub: "Происхождение кофе — от эфиопских пастухов до европейских кофеен XVII века.",
  };

  const faqs = [
    "Как правильно варить кофе?",
    "Как варить кофе в турке на плите?",
    "Как сварить кофе в турке?",
    "Как заваривать молотый кофе?",
    "Какой самый дорогой кофе?",
  ];

  const updates = [
    { num: "I", cat: "Индустрия", date: "Танзания", title: "Индустрия кофе в Танзании", blurb: "Как страна Килиманджаро строит экспорт арабики на склонах вулканов." },
    { num: "II", cat: "История", date: "Индия", title: "История кофе в Индии", blurb: "От паломника Бабу Будана до Малабарского муссонного метода обжарки." },
    { num: "III", cat: "История", date: "Кения", title: "История кофе в Кении", blurb: "Колониальные плантации, аукцион в Найроби и уникальный вкус SL28." },
    { num: "IV", cat: "Агрономия", date: "Мир", title: "Как выращивают кофе", blurb: "Высота, теневые деревья, мокрая и сухая обработка зерна." },
  ];

  const reading = [
    { t: "История кофе в Индии", c: "История" },
    { t: "Как выращивают кофе", c: "Агрономия" },
    { t: "Рецепт капучино (Cappuccino)", c: "Рецепты" },
    { t: "История кофе в Мексике", c: "История" },
  ];

  return (
    <div className="vja">
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
        <a className="active"><span className="num">I</span>О Кофе</a>
        <a><span className="num">II</span>Как готовить</a>
        <a><span className="num">III</span>Рецепты</a>
        <a><span className="num">IV</span>Полезно знать</a>
      </nav>

      {/* Hero */}
      <section className="vja-hero">
        <div>
          <h1 className="h1">
            Жизнь<br />слишком хороша<span className="for">— для плохого кофе.</span>
          </h1>
          <p className="lede">
            Мы помогаем вам найти правильный кофе и&nbsp;рассказываем, как его вкусно приготовить — с&nbsp;уважением к&nbsp;зерну, географии и&nbsp;ритуалу.
          </p>
        </div>
        <aside className="art" aria-label="Кофейная композиция">
          <div className="frame">
            <img src="assets/hero-collage.png" alt="Зёрна, помол и фирменная дуга «Все кофе»" />
          </div>
        </aside>
      </section>

      {/* Stats */}
      <section className="vja-stats">
        <div className="stat">
          <div className="num">59<span className="unit">%</span></div>
          <div className="desc">россиян пьют растворимый кофе вместо&nbsp;зернового.</div>
        </div>
        <div className="stat">
          <div className="num">37<span className="unit">%</span></div>
          <div className="desc">посетителей заказывают капучино в&nbsp;кофейнях.</div>
        </div>
        <div className="stat">
          <div className="num">2<span className="unit">—е</span></div>
          <div className="desc">место занимает кофе среди самых популярных напитков в&nbsp;мире после воды.</div>
        </div>
      </section>

      {/* Triptych */}
      <section className="vja-tript">
        <div className="col vja-pop">
          <div className="kicker" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span>Популярное</span>
            <div className="nav">
              <button className="vja-arrow" aria-label="Предыдущий">‹</button>
              <span className="count">1 / 5</span>
              <button className="vja-arrow" aria-label="Следующий">›</button>
            </div>
          </div>
          <h2>{featured.title}</h2>
          <div className="pop-img">
            <PhotoPH h={220} bg="#d9cdb3" bg2="#cdbf9f" label="фото" />
          </div>
          <p className="blurb">{featured.sub}</p>
          <div className="controls">
            <a className="read">Читать далее →</a>
            <div className="pager">
              <div className="dots">
                <div className="dot on"></div>
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col vja-faq">
          <div className="faq-img"><img src="assets/faq-coffee.jpg" alt="Чашка кофе и зёрна в фирменной ложке" /></div>
          <div className="kicker">Часто спрашивают</div>
          <h2>О <span className="em">кофе</span> — коротко.</h2>
          <ul>
            {faqs.map((q, i) => (
              <li key={i}>
                <span className="qn">{String(i + 1).padStart(2, '0')}</span>
                <span>{q}</span>
                <span className="ar">→</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="col vja-tip">
          <div className="kicker">Полезно знать</div>
          <h2 className="serif">Совет № 14</h2>
          <p>
            Молите зёрна кофе самостоятельно. Аромат и&nbsp;вкус становятся ярче, когда вы готовите кофе из&nbsp;свежемолотых зёрен — берите местную обжарку и&nbsp;мелите ровно столько, сколько нужно.
          </p>
          <div className="swap">
            <span>↻</span> Другой совет
          </div>
        </div>
      </section>

      {/* Updates section */}
      <div className="vja-sec-head">
        <h2>Обновления <span className="em">в разделах</span></h2>
        <div className="rule-fill"></div>
        <div className="nav">
          <button className="vja-arrow lg" aria-label="Предыдущие">‹</button>
          <span className="count">1 / 3</span>
          <button className="vja-arrow lg" aria-label="Следующие">›</button>
        </div>
        <div className="all">смотреть всё &nbsp;<span style={{color:'var(--accent)'}}>→</span></div>
      </div>
      <section className="vja-updates">
        {updates.map((u, i) => (
          <article className="vja-card" key={i}>
            <div className="img-wrap">
              <PhotoPH h={210} bg="#cbb892" bg2="#b9a378" fg="rgba(60,40,20,.55)" label="фото" />
            </div>
            <div className="meta-row">
              <div className="meta">{u.cat}</div>
              <div className="meta">{u.date}</div>
            </div>
            <h3>{u.title}</h3>
            <p>{u.blurb}</p>
            <a className="read">Читать далее →</a>
          </article>
        ))}
      </section>

      {/* About + Reading now */}
      <section className="vja-about">
        <div className="col">
          <h2>Чашка кофе как&nbsp;<span className="em">маленький ритуал</span>.</h2>
          <p>
            Вам нравится кофе, и&nbsp;вы наслаждаетесь его ароматом каждый день? Хотите узнать, как выращивают лучший кофе и&nbsp;где?
          </p>
          <p>
            На&nbsp;страницах нашего портала вы найдёте интересную и&nbsp;актуальную информацию: статьи о&nbsp;пользе и&nbsp;составе кофе, способах его выращивания и&nbsp;приготовления.
          </p>
          <p>
            Также в&nbsp;блоге мы&nbsp;освещаем актуальные новости кофейного рынка, обзоры событий и&nbsp;конференций. Сайт будет полезен как&nbsp;любителям кофе, так&nbsp;и&nbsp;профессиональным бариста.
          </p>
        </div>
        <div className="visual">
          <img src="assets/about-coffee.png" alt="Чашка кофе со всплеском и разлетающимися зёрнами" />
        </div>
        <aside className="reading">
          <h3>Сейчас читают</h3>
          <ol>
            {reading.map((r, i) => (
              <li key={i}>
                <div>
                  <div className="title">{r.t}</div>
                  <div className="cat">{r.c}</div>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      {/* Editors */}
      <section className="vja-eds">
        <div className="top">
          <h2>Всё об&nbsp;<span className="em">приготовлении кофе</span></h2>
          <p className="blurb">
            В&nbsp;нашей команде — профессиональные бариста, которые готовят кофе всю свою жизнь. Поэтому мы&nbsp;доверяем им&nbsp;разбираться в&nbsp;самых сложных и&nbsp;актуальных вопросах.
          </p>
        </div>
        <div className="grid">
          {[
            { name: "Михаил Кофейников", role: "Шеф-бариста", topic: "Индустрия кофе в&nbsp;Танзании" },
            { name: "Максим Сметанин", role: "Q-grader", topic: "История кофе в&nbsp;Индии" },
            { name: "Анна Зернова", role: "Обжарщик", topic: "История кофе в&nbsp;Кении" },
          ].map((e, i) => (
            <div className="ed-card" key={i}>
              <PhotoPH w={80} h={80} radius="50%" bg="#c8b08c" bg2="#b9a072" label=" " />
              <div>
                <div className="name">{e.name}</div>
                <div className="role">{e.role}</div>
                <div className="topic" dangerouslySetInnerHTML={{__html: "В&nbsp;вопросах разбирается: " + e.topic}} />
                <div style={{marginTop: 12}}>
                  <a className="vja-pop" style={{
                    fontFamily: "'Cormorant Garamond',serif",
                    fontStyle: "italic",
                    fontSize: 15,
                    color: "var(--accent)",
                    borderBottom: "1px solid var(--accent)",
                    paddingBottom: 1,
                  }}>Читать материалы →</a>
                </div>
              </div>
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
              <li>Как готовить</li>
              <li>Рецепты</li>
              <li>Полезно знать</li>
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

window.VariantJournal = VariantJournal;
window.VJA_CSS = VJA_CSS;
