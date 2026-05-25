// Logo sheet — wraps light + dark + favicon variants on a single page.

const VL_CSS = `
.vl {
  --paper: #f4eee2;
  --paper-2: #ece3d0;
  --ink: #221a14;
  --ink-2: #3d2f25;
  --ink-mute: rgba(34,26,20,0.55);
  --rule: rgba(34,26,20,0.18);
  --accent: #7a2a2a;
  --accent-2: #a04a3a;
  background: var(--paper);
  font-family: 'Manrope', system-ui, sans-serif;
  color: var(--ink);
  width: 100%;
  max-width: 1280px;
  padding: 60px;
  box-sizing: border-box;
  margin: 0 auto;
}
.vl * { box-sizing: border-box; }
.vl .kicker {
  font-family: 'Manrope', sans-serif;
  font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
  font-weight: 600; color: var(--accent);
  margin-bottom: 14px;
}
.vl .meta {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--ink-mute);
}
.vl h1 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  font-size: 56px;
  letter-spacing: -0.025em;
  line-height: 1;
  margin: 0 0 8px;
}
.vl h1 .em { font-style: italic; color: var(--accent); }
.vl .intro {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 20px;
  color: var(--ink-2);
  margin: 0 0 50px;
  max-width: 760px;
}
.vl .grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.vl .grid .full { grid-column: span 2; }
.vl .card {
  border: 1px solid var(--rule);
  background: var(--paper);
  padding: 36px 32px 24px;
  position: relative;
}
.vl .card.dark {
  background: var(--ink);
  border-color: rgba(244,238,226,0.12);
}
.vl .card .head {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 28px;
}
.vl .card .name {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 22px;
  color: var(--ink);
}
.vl .card.dark .name { color: var(--paper); }
.vl .card.dark .meta { color: rgba(244,238,226,0.5); }
.vl .stage {
  min-height: 130px;
  display: flex; align-items: center; justify-content: center;
  padding: 16px 0 26px;
}
.vl .foot {
  display: flex; justify-content: space-between; align-items: baseline;
  border-top: 1px solid var(--rule);
  padding-top: 14px;
}
.vl .card.dark .foot { border-color: rgba(244,238,226,0.15); }
.vl .desc {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 15px;
  color: var(--ink-mute);
  max-width: 70%;
}
.vl .card.dark .desc { color: rgba(244,238,226,0.6); }

/* Wordmark base */
.vl .wm {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 500;
  letter-spacing: -0.015em;
  line-height: 1;
}
.vl .wm .e { font-style: italic; color: var(--accent); }
`;

function LogoSheet() {
  React.useEffect(() => {
    if (document.getElementById("vl-style")) return;
    const s = document.createElement("style");
    s.id = "vl-style";
    s.textContent = VL_CSS;
    document.head.appendChild(s);
  }, []);

  return (
    <div className="vl">
      <div className="kicker">Логотип «Все кофе»</div>
      <h1>Знак&nbsp;<span className="em">+ wordmark</span></h1>
      <p className="intro">
        Минималистичная геометричная чашка с&nbsp;поднимающимся паром, рядом — сериф Cormorant Garamond. Светлая версия — для&nbsp;шапки, тёмная — для&nbsp;подвала, знак соло — для&nbsp;favicon и&nbsp;аватаров.
      </p>
      <div className="grid">
        <LogoLight />
        <LogoDark />
        <div className="full"><LogoFavicon /></div>
      </div>
      <ContextTests />
    </div>
  );
}

window.LogoSheet = LogoSheet;
