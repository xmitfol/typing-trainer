// Logo variants — final set: light (D), dark (F), favicon glyph.
// Uses CupGlyph from placeholders.jsx (globally available).

// === Light version (header use) ============================================

function LogoLight() {
  return (
    <div className="card">
      <div className="head">
        <div className="name">Светлая версия</div>
        <div className="meta">для шапки и светлых поверхностей</div>
      </div>
      <div className="stage">
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
          <CupGlyph size={48} color="#7a2a2a" />
          <span className="wm" style={{ fontSize: 48 }}>
            Все&nbsp;<span className="e">кофе</span>
          </span>
        </div>
      </div>
      <div className="foot">
        <div className="desc">Винная чашка + сериф. Используется в&nbsp;шапке, на&nbsp;карточках, в&nbsp;печати.</div>
        <div className="meta">primary</div>
      </div>
    </div>
  );
}

// === Dark version (footer use) =============================================

function LogoDark() {
  return (
    <div className="card dark">
      <div className="head">
        <div className="name">Тёмная версия</div>
        <div className="meta">для подвала и тёмных секций</div>
      </div>
      <div className="stage">
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
          <CupGlyph size={48} color="#d97a4a" />
          <span className="wm" style={{ fontSize: 48, color: "#f4eee2" }}>
            Все&nbsp;<span style={{ fontStyle: "italic", color: "#d97a4a" }}>кофе</span>
          </span>
        </div>
      </div>
      <div className="foot">
        <div className="desc">Та же чашка, но&nbsp;терракотовая. Используется в&nbsp;подвале и&nbsp;на&nbsp;тёмных карточках.</div>
        <div className="meta">dark</div>
      </div>
    </div>
  );
}

// === Favicon — glyph only =================================================

function LogoFavicon() {
  return (
    <div className="card">
      <div className="head">
        <div className="name">Favicon · только знак</div>
        <div className="meta">favicon · аватар · приложение</div>
      </div>
      <div className="stage" style={{ display: "flex", gap: 28, justifyContent: "center", alignItems: "center" }}>
        {/* 16px — true favicon size */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <CupGlyph size={16} color="#7a2a2a" />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,26,20,0.55)" }}>16 px</span>
        </div>
        {/* 32px */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <CupGlyph size={32} color="#7a2a2a" />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,26,20,0.55)" }}>32 px</span>
        </div>
        {/* 64px on cream tile */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#f4eee2", padding: 12, border: "1px solid rgba(34,26,20,0.18)" }}>
            <CupGlyph size={64} color="#7a2a2a" />
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,26,20,0.55)" }}>64 · тайл</span>
        </div>
        {/* 64px on ink */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#221a14", padding: 12, border: "1px solid rgba(34,26,20,0.18)" }}>
            <CupGlyph size={64} color="#d97a4a" />
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,26,20,0.55)" }}>64 · dark</span>
        </div>
      </div>
      <div className="foot">
        <div className="desc">Чашка соло — favicon, иконка PWA, аватар в&nbsp;соцсетях, ярлык приложения.</div>
        <div className="meta">glyph</div>
      </div>
    </div>
  );
}

// === Context tests — header + footer mockups ===============================

function ContextTests() {
  return (
    <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{
        fontFamily: "'Manrope', sans-serif",
        fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase",
        fontWeight: 600, color: "#7a2a2a",
        marginBottom: 4,
      }}>
        В контексте · реальная шапка и подвал
      </div>

      {/* Header on cream */}
      <div style={{ border: "1px solid rgba(34,26,20,0.18)", overflow: "hidden" }}>
        <div style={{
          background: "#f4eee2",
          padding: "22px 60px",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: 30,
          alignItems: "center",
          borderBottom: "1px solid rgba(34,26,20,0.18)",
        }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
            <CupGlyph size={36} color="#7a2a2a" />
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 600,
                fontSize: 34,
                letterSpacing: "-0.01em",
                color: "#221a14",
                lineHeight: 1,
              }}>
                Все&nbsp;<span style={{ fontStyle: "italic", color: "#7a2a2a", fontWeight: 500 }}>кофе</span>
              </span>
              <span style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: 10,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "rgba(34,26,20,0.55)",
              }}>
                Большая энциклопедия кофе
              </span>
            </div>
          </div>
          <div />
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(34,26,20,0.55)",
          }}>
            Поиск · vk · tg
          </div>
        </div>
        <div style={{ padding: "10px 60px", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,26,20,0.45)" }}>
          ↑ шапка сайта
        </div>
      </div>

      {/* Footer on ink */}
      <div style={{ border: "1px solid rgba(34,26,20,0.18)", overflow: "hidden" }}>
        <div style={{
          background: "#221a14",
          padding: "32px 60px",
          color: "rgba(244,238,226,0.9)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
            <CupGlyph size={40} color="#d97a4a" />
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 600,
              fontSize: 36,
              letterSpacing: "-0.015em",
              color: "#f4eee2",
              lineHeight: 1,
            }}>
              Все&nbsp;<span style={{ fontStyle: "italic", color: "#d97a4a", fontWeight: 500 }}>кофе</span>
            </span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(244,238,226,0.5)" }}>
            © 2022—2026
          </div>
        </div>
        <div style={{ padding: "10px 60px", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,26,20,0.45)" }}>
          ↑ подвал сайта
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LogoLight, LogoDark, LogoFavicon, ContextTests });
