// Mobile main page — Variant A "Редакция" style at 375 px.
// Reuses .vja palette + fonts; adds .vjm-* mobile-specific classes.

const VJM_CSS = `
.vja.vjm {
  width: 375px;
  font-size: 14px;
}

/* ---------- Mobile masthead ---------- */
.vjm-top {
  padding: 14px 18px;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid var(--rule);
}
.vjm-top .burger {
  width: 22px; height: 14px;
  display: flex; flex-direction: column; justify-content: space-between;
}
.vjm-top .burger span { display: block; height: 1.5px; background: var(--ink); }
.vjm-top .burger span:nth-child(2) { width: 70%; }
.vjm-top .brand {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 22px;
  letter-spacing: -0.01em;
  display: inline-flex; align-items: center; gap: 8px;
}
.vjm-top .brand .em { font-style: italic; color: var(--accent); font-weight: 500; }
  font-size: 22px;
  letter-spacing: -0.01em;
  text-align: center;
}
.vjm-top .ic {
  width: 34px; height: 34px; border-radius: 50%;
  border: 1px solid var(--rule);
  display: flex; align-items: center; justify-content: center;
  color: var(--ink-mute);
}
.vjm-top .ic.search svg { width: 13px; height: 13px; }

/* ---------- Nav strip (horizontal scroll) ---------- */
.vjm-nav {
  padding: 12px 18px;
  display: flex; gap: 22px;
  overflow-x: auto;
  border-bottom: 1px solid var(--rule);
  font-family: 'Cormorant Garamond', serif;
  font-size: 17px;
}
.vjm-nav a {
  white-space: nowrap;
  color: var(--ink);
  text-decoration: none;
}
.vjm-nav a.on { font-style: italic; color: var(--accent); }
.vjm-nav .num {
  font-family: 'Manrope', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--ink-mute);
  margin-right: 4px;
  vertical-align: super;
}

/* ---------- Hero ---------- */
.vjm-hero { padding: 26px 18px 30px; border-bottom: 1px solid var(--rule); }
.vjm-hero .kicker {
  font-family: 'Manrope', sans-serif;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 14px;
}
.vjm-hero h1 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  font-size: 44px;
  line-height: 0.95;
  letter-spacing: -0.02em;
  margin: 0 0 12px;
}
.vjm-hero h1 .em { font-style: italic; color: var(--accent); display: block; }
.vjm-hero .lede {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 17px;
  line-height: 1.45;
  color: var(--ink-2);
  margin: 0 0 22px;
}
.vjm-hero .art {
  position: relative;
  margin: 14px 0 22px;
}
.vjm-hero .art img { width: 100%; height: auto; display: block; }
.vjm-hero .art .badge {
  position: absolute;
  left: 0; top: 6px;
  background: var(--ink); color: var(--paper);
  padding: 6px 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
  display: inline-flex; gap: 8px; align-items: center;
}
.vjm-hero .art .badge .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--teal); }
.vjm-hero .credit {
  padding-top: 12px;
  border-top: 1px solid var(--rule);
  display: flex; justify-content: space-between;
  font-family: 'Manrope', sans-serif; font-size: 11px;
  letter-spacing: 0.06em; color: var(--ink-mute);
}
.vjm-hero .credit .it {
  font-family: 'Cormorant Garamond', serif; font-style: italic;
  font-size: 14px; color: var(--ink);
}

/* ---------- Stats (2x2 grid) ---------- */
.vjm-stats {
  padding: 28px 18px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 24px;
  border-bottom: 1px solid var(--rule);
}
.vjm-stats .stat {}
.vjm-stats .num {
  font-family: 'Cormorant Garamond', serif;
  font-size: 64px;
  line-height: 1;
  font-weight: 500;
  letter-spacing: -0.03em;
}
.vjm-stats .num .unit {
  font-size: 18px;
  font-style: italic;
  color: var(--accent);
  margin-left: 2px;
  vertical-align: top;
}
.vjm-stats .desc {
  font-family: 'Manrope', sans-serif;
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--ink-mute);
  margin-top: 8px;
}

/* ---------- Popular (stacked card) ---------- */
.vjm-pop {
  padding: 28px 18px;
  border-bottom: 1px solid var(--rule);
}
.vjm-pop .head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px;
  font-family: 'Manrope', sans-serif;
  font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
  font-weight: 700;
}
.vjm-pop .head .l { color: var(--accent); }
.vjm-pop .head .r { color: var(--ink-mute); display: flex; gap: 10px; align-items: center; }
.vjm-pop h2 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  font-size: 30px;
  line-height: 1.05;
  letter-spacing: -0.01em;
  margin: 0 0 16px;
}
.vjm-pop .img {
  aspect-ratio: 16/10;
  margin-bottom: 14px;
  background-image: repeating-linear-gradient(135deg, #d9cdb3 0, #d9cdb3 8px, #cdbf9f 8px, #cdbf9f 16px);
  display: flex; align-items: center; justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(40,28,16,0.55);
  position: relative;
}
.vjm-pop h3 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 22px;
  line-height: 1.15;
  margin: 0 0 8px;
}
.vjm-pop p {
  font-family: 'Manrope', sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ink-mute);
  margin: 0 0 14px;
}
.vjm-pop .read {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic; font-size: 16px;
  color: var(--accent);
  border-bottom: 1px solid var(--accent);
  padding-bottom: 1px;
}

/* ---------- FAQ ---------- */
.vjm-faq {
  padding: 28px 18px;
  border-bottom: 1px solid var(--rule);
}
.vjm-faq .head { display: flex; gap: 14px; align-items: center; margin-bottom: 14px; }
.vjm-faq .head .img {
  width: 56px; height: 56px; border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(34,26,20,0.12);
}
.vjm-faq .head .img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.vjm-faq .kicker {
  font-family: 'Manrope', sans-serif;
  font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
  font-weight: 700; color: var(--accent);
}
.vjm-faq h2 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  font-size: 30px;
  line-height: 1.05;
  margin: 2px 0 16px;
}
.vjm-faq h2 .em { font-style: italic; color: var(--accent); }
.vjm-faq ul { list-style: none; padding: 0; margin: 0; }
.vjm-faq li {
  display: grid;
  grid-template-columns: 24px 1fr 20px;
  gap: 10px;
  padding: 13px 0;
  border-bottom: 1px solid var(--rule);
  align-items: center;
  font-family: 'Cormorant Garamond', serif;
  font-size: 17px;
  line-height: 1.25;
}
.vjm-faq li:last-child { border-bottom: 0; }
.vjm-faq li .n {
  font-family: 'Manrope', sans-serif;
  font-size: 9px; letter-spacing: 0.12em; font-weight: 700;
  color: var(--accent);
}
.vjm-faq li .ar {
  text-align: right;
  font-family: 'Cormorant Garamond', serif; font-style: italic;
  color: var(--ink-mute);
}

/* ---------- Tip dark card ---------- */
.vjm-tip {
  margin: 28px 18px;
  background: var(--ink);
  color: var(--paper);
  padding: 26px 22px;
}
.vjm-tip .kicker {
  font-family: 'Manrope', sans-serif;
  font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
  font-weight: 700; color: var(--accent-2);
  margin-bottom: 14px;
}
.vjm-tip h3 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 26px;
  margin: 0 0 14px;
}
.vjm-tip p {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 17px;
  line-height: 1.5;
  margin: 0 0 18px;
  color: rgba(244,238,226,0.9);
}
.vjm-tip .swap {
  font-family: 'Manrope', sans-serif;
  font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
  border: 1px solid rgba(244,238,226,0.25);
  padding: 10px 16px;
  display: inline-flex; gap: 8px; align-items: center;
  color: rgba(244,238,226,0.85);
}

/* ---------- Updates section ---------- */
.vjm-sec-head {
  padding: 36px 18px 18px;
  display: flex; flex-direction: column; gap: 8px;
  border-top: 1px solid var(--rule);
}
.vjm-sec-head h2 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  font-size: 36px;
  line-height: 1;
  letter-spacing: -0.02em;
  margin: 0;
}
.vjm-sec-head h2 .em { font-style: italic; color: var(--accent); }
.vjm-sec-head .all {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 15px;
  color: var(--accent);
}

.vjm-updates {
  padding: 6px 18px 24px;
  display: flex; flex-direction: column; gap: 24px;
  border-bottom: 1px solid var(--rule);
}
.vjm-u-card {}
.vjm-u-card .img-wrap { position: relative; margin-bottom: 12px; }
.vjm-u-card .img {
  aspect-ratio: 16/10;
  background-image: repeating-linear-gradient(135deg, #cbb892 0, #cbb892 8px, #b9a378 8px, #b9a378 16px);
  display: flex; align-items: center; justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(40,28,16,0.55);
}
.vjm-u-card .num {
  position: absolute; left: 10px; top: 10px;
  width: 32px; height: 32px;
  background: var(--paper); color: var(--accent);
  border: 1px solid var(--rule);
  border-radius: 50%;
  font-family: 'Cormorant Garamond', serif; font-style: italic;
  font-size: 18px;
  display: flex; align-items: center; justify-content: center;
  padding-top: 1px;
}
.vjm-u-card .meta-row {
  display: flex; justify-content: space-between;
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-mute);
  margin-bottom: 6px;
}
.vjm-u-card h3 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 20px;
  line-height: 1.15;
  margin: 0 0 8px;
}
.vjm-u-card p {
  font-family: 'Manrope', sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ink-mute);
  margin: 0 0 8px;
}
.vjm-u-card .read {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic; font-size: 15px;
  color: var(--accent);
}

/* ---------- About ---------- */
.vjm-about {
  padding: 30px 18px;
  border-bottom: 1px solid var(--rule);
}
.vjm-about .kicker {
  font-family: 'Manrope', sans-serif;
  font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
  font-weight: 700; color: var(--accent);
  margin-bottom: 14px;
}
.vjm-about h2 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  font-size: 32px;
  line-height: 1.05;
  letter-spacing: -0.015em;
  margin: 0 0 18px;
}
.vjm-about h2 .em { font-style: italic; color: var(--accent); }
.vjm-about .visual {
  margin: 14px 0 18px;
  display: flex; align-items: center; justify-content: center;
}
.vjm-about .visual img {
  width: 42%;
  max-width: 150px;
  height: auto;
  display: block;
}
.vjm-about p {
  font-family: 'Cormorant Garamond', serif;
  font-size: 17px;
  line-height: 1.55;
  color: var(--ink-2);
  margin: 0 0 12px;
}
.vjm-about p:first-of-type::first-letter {
  font-size: 50px;
  float: left;
  line-height: 0.9;
  font-weight: 600;
  margin: 6px 8px 0 0;
  color: var(--accent);
}

/* ---------- Reading now (mobile) ---------- */
.vjm-reading {
  padding: 30px 18px;
  border-bottom: 1px solid var(--rule);
}
.vjm-reading h3 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 24px;
  margin: 0 0 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--rule);
}
.vjm-reading ol { list-style: none; padding: 0; margin: 0; counter-reset: r; }
.vjm-reading li {
  counter-increment: r;
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--rule);
  align-items: start;
}
.vjm-reading li::before {
  content: counter(r, decimal-leading-zero);
  font-family: 'Manrope', sans-serif;
  font-size: 11px;
  letter-spacing: 0.12em;
  font-weight: 700;
  color: var(--accent);
  padding-top: 3px;
}
.vjm-reading li .title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 17px;
  line-height: 1.25;
  font-weight: 500;
}
.vjm-reading li .cat {
  font-family: 'Manrope', sans-serif;
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-mute);
  margin-top: 4px;
}

/* ---------- Editors carousel-ish stack ---------- */
.vjm-eds {
  padding: 36px 18px;
  background: var(--paper-2);
}
.vjm-eds h2 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  font-size: 32px;
  line-height: 1.05;
  margin: 12px 0 18px;
  letter-spacing: -0.015em;
}
.vjm-eds h2 .em { font-style: italic; color: var(--accent); }
.vjm-eds .blurb {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 18px;
  line-height: 1.5;
  color: var(--ink-2);
  margin: 0 0 22px;
}
.vjm-eds .cards {
  display: flex; flex-direction: column; gap: 14px;
}
.vjm-eds .e {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 14px;
  padding: 14px;
  background: var(--paper);
  border: 1px solid var(--rule);
}
.vjm-eds .e .name {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 18px;
  line-height: 1.15;
  margin-bottom: 4px;
}
.vjm-eds .e .role {
  font-family: 'Manrope', sans-serif;
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 6px;
  font-weight: 700;
}
.vjm-eds .e .topic {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 14px;
  line-height: 1.4;
  color: var(--ink-mute);
}

/* ---------- Footer ---------- */
.vjm-foot {
  background: var(--ink);
  color: rgba(244,238,226,0.85);
  padding: 36px 18px 22px;
}
.vjm-foot .brand .lockup { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.vjm-foot .brand .n {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 30px;
  color: var(--paper);
  margin-bottom: 10px;
}
.vjm-foot .brand p {
  font-size: 13px;
  line-height: 1.55;
  color: rgba(244,238,226,0.55);
  margin: 0 0 16px;
}
.vjm-foot .news {
  margin: 20px 0 26px;
  padding: 16px;
  background: rgba(244,238,226,0.04);
  border: 1px solid rgba(244,238,226,0.10);
}
.vjm-foot .news h4 {
  font-family: 'Manrope', sans-serif;
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--accent-2);
  margin: 0 0 10px;
}
.vjm-foot .news input {
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(244,238,226,0.25);
  color: var(--paper);
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 16px;
  padding: 8px 0;
  width: 100%;
  outline: none;
}
.vjm-foot .news .btn {
  margin-top: 12px;
  background: var(--accent);
  color: var(--paper);
  padding: 11px 16px;
  font-family: 'Manrope', sans-serif;
  font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
  font-weight: 700;
  display: inline-flex; gap: 8px; align-items: center;
}
.vjm-foot ul { list-style: none; padding: 0; margin: 0; }
.vjm-foot li {
  padding: 5px 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: 17px;
  color: rgba(244,238,226,0.85);
}
.vjm-foot .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 22px; }
.vjm-foot .cols h4 {
  font-family: 'Manrope', sans-serif;
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--accent-2);
  margin: 0 0 10px;
}
.vjm-foot .bottom {
  padding-top: 18px;
  border-top: 1px solid rgba(244,238,226,0.12);
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(244,238,226,0.45);
  display: flex; justify-content: space-between;
}
`;

function MobileJournal() {
  React.useEffect(() => {
    if (!document.getElementById("vja-style") && window.VJA_CSS) {
      const s = document.createElement("style");
      s.id = "vja-style";
      s.textContent = window.VJA_CSS;
      document.head.appendChild(s);
    }
    if (!document.getElementById("vjm-style")) {
      const s2 = document.createElement("style");
      s2.id = "vjm-style";
      s2.textContent = VJM_CSS;
      document.head.appendChild(s2);
    }
  }, []);

  const faqs = [
    "Как правильно варить кофе?",
    "Как варить кофе в турке на плите?",
    "Как сварить кофе в турке?",
    "Как заваривать молотый кофе?",
    "Какой самый дорогой кофе?",
  ];
  const updates = [
    { num: "I",   cat: "Индустрия", date: "Танзания", title: "Индустрия кофе в Танзании", blurb: "Склоны Килиманджаро и&nbsp;кооперативы Моши." },
    { num: "II",  cat: "История",   date: "Индия",    title: "История кофе в Индии",     blurb: "От&nbsp;Бабу Будана до&nbsp;муссонного Малабара." },
    { num: "III", cat: "История",   date: "Кения",    title: "История кофе в Кении",     blurb: "SL28, аукцион в&nbsp;Найроби, нота смородины." },
    { num: "IV",  cat: "Агрономия", date: "Мир",      title: "Как выращивают кофе",       blurb: "Высота, теневые деревья, мокрая обработка." },
  ];
  const reading = [
    { t: "История кофе в Индии", c: "История" },
    { t: "Как выращивают кофе", c: "Агрономия" },
    { t: "Рецепт капучино (Cappuccino)", c: "Рецепты" },
    { t: "История кофе в Мексике", c: "История" },
  ];

  return (
    <div className="vja vjm">
      {/* Mobile top bar */}
      <div className="vjm-top">
        <div className="burger"><span></span><span></span><span></span></div>
        <div className="brand"><CupGlyph size={24} color="#7a2a2a" />Все&nbsp;<span className="em">кофе</span></div>
        <div className="ic search">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="7" cy="7" r="5"/><path d="m11 11 4 4"/></svg>
        </div>
        <div className="ic" style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontSize:13}}>vk</div>
      </div>

      {/* Nav scroll */}
      <nav className="vjm-nav">
        <a className="on"><span className="num">I</span>О Кофе</a>
        <a><span className="num">II</span>Как готовить</a>
        <a><span className="num">III</span>Рецепты</a>
        <a><span className="num">IV</span>Полезно знать</a>
        <a><span className="num">V</span>По странам</a>
      </nav>

      {/* Hero */}
      <section className="vjm-hero">
        <h1>
          Жизнь слишком хороша<span className="em">— для плохого кофе.</span>
        </h1>
        <p className="lede">
          Помогаем находить правильное зерно и&nbsp;готовить его так, чтобы кофе пах кофе — с&nbsp;уважением к&nbsp;географии, обжарке и&nbsp;ритуалу.
        </p>
        <div className="art">
          <img src="assets/hero-collage.png" alt="Зёрна, помол и фирменная дуга «Все кофе»" />
        </div>
      </section>

      {/* Stats */}
      <section className="vjm-stats">
        <div className="stat">
          <div className="num">59<span className="unit">%</span></div>
          <div className="desc">россиян пьют растворимый кофе.</div>
        </div>
        <div className="stat">
          <div className="num">37<span className="unit">%</span></div>
          <div className="desc">в&nbsp;кофейнях заказывают капучино.</div>
        </div>
        <div className="stat">
          <div className="num">№2</div>
          <div className="desc">место в&nbsp;мире после воды.</div>
        </div>
        <div className="stat">
          <div className="num">412</div>
          <div className="desc">материалов на&nbsp;сайте.</div>
        </div>
      </section>

      {/* Popular */}
      <section className="vjm-pop">
        <div className="head">
          <span className="l">Популярное</span>
          <span className="r">
            <button className="vja-arrow" aria-label="Назад">‹</button>
            <span style={{padding:'0 4px'}}>1 / 5</span>
            <button className="vja-arrow" aria-label="Вперёд">›</button>
          </span>
        </div>
        <h2>История кофе</h2>
        <div className="img">PLATE I · ORIGIN MAP</div>
        <h3>Происхождение кофе</h3>
        <p>От&nbsp;эфиопских пастухов до&nbsp;европейских кофеен XVII&nbsp;века — ключевая статья номера.</p>
        <a className="read">Читать далее →</a>
      </section>

      {/* FAQ */}
      <section className="vjm-faq">
        <div className="head">
          <div className="img"><img src="assets/faq-coffee.jpg" alt="Чашка кофе и зёрна" /></div>
          <div>
            <div className="kicker">Часто спрашивают</div>
            <h2 style={{marginTop: 0}}>О <span className="em">кофе</span></h2>
          </div>
        </div>
        <ul>
          {faqs.map((q, i) => (
            <li key={i}>
              <span className="n">{String(i+1).padStart(2,'0')}</span>
              <span>{q}</span>
              <span className="ar">→</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Tip dark card */}
      <section className="vjm-tip">
        <div className="kicker">Полезно знать · № 14</div>
        <h3>Молите зёрна самостоятельно</h3>
        <p>
          Аромат и&nbsp;вкус становятся ярче, когда вы&nbsp;готовите кофе из&nbsp;свежемолотых зёрен — берите местную обжарку и&nbsp;мелите ровно столько, сколько нужно.
        </p>
        <div className="swap">↻ Другой совет</div>
      </section>

      {/* Updates header */}
      <div className="vjm-sec-head">
        <h2>Обновления <span className="em">в разделах</span></h2>
        <div style={{display:'flex', gap: 8, alignItems:'center', fontFamily:"'Manrope',sans-serif", fontSize: 10, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--ink-mute)'}}>
          <button className="vja-arrow" aria-label="Назад">‹</button>
          <span>1 / 3</span>
          <button className="vja-arrow" aria-label="Вперёд">›</button>
        </div>
      </div>

      {/* Updates */}
      <section className="vjm-updates">
        {updates.map((u, i) => (
          <article className="vjm-u-card" key={i}>
            <div className="img-wrap">
              <div className="img">фото</div>
            </div>
            <div className="meta-row">
              <span>{u.cat}</span>
              <span>{u.date}</span>
            </div>
            <h3>{u.title}</h3>
            <p dangerouslySetInnerHTML={{__html: u.blurb}} />
            <a className="read">Читать далее →</a>
          </article>
        ))}
      </section>

      {/* About */}
      <section className="vjm-about">
        <h2>Чашка кофе как&nbsp;<span className="em">маленький ритуал</span>.</h2>
        <div className="visual">
          <img src="assets/about-coffee.png" alt="Чашка кофе со всплеском" />
        </div>
        <p>
          Вам нравится кофе и&nbsp;вы&nbsp;наслаждаетесь его ароматом каждый день? Хотите узнать, как выращивают лучший кофе&nbsp;— и&nbsp;где?
        </p>
        <p>
          На&nbsp;страницах нашего портала вы&nbsp;найдёте интересную и&nbsp;актуальную информацию: статьи о&nbsp;пользе и&nbsp;составе кофе, способах его выращивания и&nbsp;приготовления.
        </p>
        <p>
          Также в&nbsp;блоге освещаем актуальные новости рынка, обзоры событий и&nbsp;конференций&nbsp;— полезно и&nbsp;любителям, и&nbsp;бариста.
        </p>
      </section>

      {/* Reading now */}
      <section className="vjm-reading">
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
      </section>

      {/* Editors */}
      <section className="vjm-eds">
        <div className="kicker" style={{
          fontFamily:"'Manrope',sans-serif",
          fontSize:10,letterSpacing:"0.22em",
          textTransform:"uppercase",fontWeight:700,color:"var(--accent)",
        }}>Команда</div>
        <h2>Всё об&nbsp;<span className="em">приготовлении кофе</span></h2>
        <p className="blurb">
          В&nbsp;нашей команде — профессиональные бариста, которые готовят кофе всю свою жизнь.
        </p>
        <div className="cards">
          {[
            { name: "Михаил Кофейников", role: "Шеф-бариста", topic: "Индустрия кофе в Танзании" },
            { name: "Максим Сметанин", role: "Q-grader", topic: "История кофе в Индии" },
            { name: "Анна Зернова", role: "Обжарщик", topic: "История кофе в Кении" },
          ].map((e, i) => (
            <div className="e" key={i}>
              <PhotoPH w={56} h={56} radius="50%" bg="#c8b08c" bg2="#b9a072" label=" " />
              <div>
                <div className="name">{e.name}</div>
                <div className="role">{e.role}</div>
                <div className="topic">Разбирается: {e.topic}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="vjm-foot">
        <div className="brand">
          <div className="lockup">
            <CupGlyph size={30} color="#d97a4a" />
            <div className="n">Все кофе</div>
          </div>
          <p>© 2022—2026 · Большая энциклопедия кофе. Все материалы защищены авторским правом.</p>
        </div>

        <div className="news">
          <h4>Подписка</h4>
          <input placeholder="ваш@email.ru" />
          <div className="btn">Подписаться →</div>
        </div>

        <div className="cols">
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
              <li>Карта сайта</li>
              <li>Политика</li>
              <li>@vsecoffee</li>
            </ul>
          </div>
        </div>

        <div className="bottom">
          <div>vsecoffee.ru</div>
          <div>Большая энциклопедия</div>
        </div>
      </footer>
    </div>
  );
}

window.MobileJournal = MobileJournal;
