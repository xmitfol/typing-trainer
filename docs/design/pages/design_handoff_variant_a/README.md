# Handoff: vsecoffee — Вариант A «Редакция» (журнальный)

Дизайн-пакет для разработчика, который реализует новый сайт `vsecoffee.ru` на **Astro**.
Все ссылки на компоненты, переменные и сетки в этом документе соответствуют HTML/JSX-прототипам в папке `sources/`.

---

## 1. О файлах в этом пакете

Файлы в `sources/` — это **дизайн-референсы**, написанные на React + inline CSS поверх «холста» для визуализации. **Это не production-код.** Задача — **воссоздать те же экраны в Astro-проекте**, используя его собственные паттерны: компоненты `.astro`, layouts, slots, MDX для статей, CSS-переменные или Tailwind на ваш выбор.

JSX-файлы стоит читать как «исходник макета» — там есть точные размеры, отступы, типографика и палитра, которые нужно перенести 1-в-1.

## 2. Fidelity

**High-fidelity.** Все значения — финальные:
- цвета подобраны
- шрифты подобраны
- сетки и отступы подобраны
- интеракции описаны в этом README (sticky-TOC, swap-tip, и т.д.)

Дев должен воссоздать пиксельно близко.

## 3. Что входит в этот пакет

| Экран | Файл-источник | Ширина |
|---|---|---|
| Главная (десктоп) | `sources/variant-journal.jsx` | 1280 px (контент-макс ≈ 1140) |
| Главная (мобайл) | `sources/mobile-journal.jsx` | 375 px |
| Статья «Кофе в Индии» (десктоп) | `sources/article-journal.jsx` | 1280 px |
| Плейсхолдеры | `sources/placeholders.jsx` | — |
| Брендовые ассеты | `assets/` | — |

Скриншоты не приложены — открывайте JSX в браузере, либо см. живой холст в исходном дизайн-проекте.

---

## 4. Эстетика: «Редакция»

Журнальный/редакционный стиль — кофе подан как альманах. Сериф-заголовки с курсивным акцентом, мягкая бумажная фактура, винный акцент, моно-метки для редакционной информации.

**НЕ модный SaaS-сайт с градиентами и закруглёнными плашками.** Любые «emoji»-иконки, кричащие CTA, broflakes-стиль — мимо

### 4.1 Чего НЕ должно быть на сайте (важно!)

Прототипы в `sources/` — это **дизайн-референсы**, и в ранних версиях встречались декоративные элементы «как в журнале». **На реальном сайте этого быть не должно** — это сайт-энциклопедия, не печатный выпуск:

- ❌ «№ 142 · Зима 2026», даты выпусков, упоминания «альманаха»
- ❌ kicker «Слово редакции · 22 мая 2026» над H1
- ❌ meta «Эссе номера — стр. 04», «Стр. 04» под изображениями
- ❌ badge `Hero номера` на hero-картинке
- ❌ подписи `© vsecoffee` / `illustration` под изображениями
- ❌ kicker `О сайте · 2022–2026` над секцией «О сайте»
- ❌ моно-плейсхолдеры внутри фото-заглушек (`PLANTATION · Танзания`, `ARCHIVE · BEAN ORIGIN MAP` и т.п.) — это маркеры для дизайнера, в реальные `<Image>` ничего такого не вписывать
- ❌ фон + рамка + бирюзовое свечение `teal-soft` вокруг иллюстрации в «О сайте» — теперь просто центрованное изображение
- ❌ красный квадрат с кремовым римским номером на updates-карточках — вообще убран (был рудимент журнального макета)

Если в JSX-исходниках где-то остался такой элемент, считайте это рудиментом — не переносите в продакшен..

---

## 5. Дизайн-токены

### 5.1 Цвета (CSS-переменные)

```css
:root {
  --paper:     #f4eee2;  /* фон страницы — тёплая бумага */
  --paper-2:   #ece3d0;  /* приглушённый блок (карточки, плашки) */
  --ink:       #221a14;  /* основной текст */
  --ink-2:     #3d2f25;  /* вторичный текст */
  --ink-mute:  rgba(34,26,20,0.55);  /* мета, подписи */
  --rule:      rgba(34,26,20,0.18);  /* линии-разделители */

  --accent:    #7a2a2a;  /* винно-бордовый — главный акцент */
  --accent-2:  #a04a3a;  /* терракотовый — вторичный */
  --teal:      #19a7c2;  /* бирюзовый — из бренда (hero-коллаж) */
  --teal-soft: rgba(25,167,194,0.18);  /* мягкое свечение */
}
```

**Правила использования:**
- `--accent` (винный) — для курсивных акцентов в заголовках, ссылок «Читать далее», метки `№`, маленьких декоративных точек, левых-бордеров в callout'ах.
- `--teal` — только в hero (коллаж зерна на нём «живёт») и как мягкий радиальный glow за иллюстрацией в секции «О сайте». **Не использовать как CTA-цвет.**
- `--paper-2` — фон для блоков-плашек («Полезно знать», country-fact panel, callout'ы в статье).
- `--ink` как фон + `--paper` как текст — тёмные карточки «Полезно знать» и подвал.

### 5.2 Типографика

Три семейства. Загрузить через Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet" />
```

| Роль | Семейство | Когда |
|---|---|---|
| Display / заголовки | **Cormorant Garamond** (400-700, italic) | H1, H2, H3, цитаты, числа в hero, fact-цифры |
| Body / UI | **Manrope** (300-800) | основной body-текст в UI, мета, кикеры, навигация цифрами |
| Mono / меta | **JetBrains Mono** (300-600) | подписи к фото, code-метки, координаты, badges |

**Заголовки H1 (hero / страница статьи):**
- `font-family: Cormorant Garamond`
- `font-weight: 500`
- `font-size: 74px` (главная) / `78px` (статья) / `44px` (мобайл)
- `line-height: 0.98` (главная), `1.0` (статья)
- `letter-spacing: -0.025em`
- Курсивный акцент в одном слове или фразе: `<span class="em">` → `font-style: italic; color: var(--accent); font-weight: 400;`

**H2 секций:**
- `Cormorant Garamond` 500
- `font-size: 56px` (главная) / `42-48px` (статья)
- `letter-spacing: -0.02em`
- Аналогичный курсивный акцент

**Body:**
- `Manrope` 400, 15px / 1.55 — UI и интерфейсные тексты
- `Cormorant Garamond` 400-500, 19px / 1.65 — body статьи (читабельнее в длинном чтении)

**Lede (подзаголовок hero):**
- `Cormorant Garamond` italic 21px / 1.45

**Kicker (надзаголовок секции):**
- `Manrope` 600, 11px, `letter-spacing: 0.22em`, UPPERCASE, `color: var(--accent)`

**Meta (даты, теги, координаты):**
- `Manrope` 500, 11px, `letter-spacing: 0.16em`, UPPERCASE, `color: var(--ink-mute)`

### 5.3 Размеры и сетки

```css
:root {
  --content-max: 1140px;
  --side-pad-desktop: 60px;
  --side-pad-mobile: 18px;
}
```

**Десктоп:** контейнер 1140 px, по 60 px паддинг по бокам (=1280 артборд). Все секции верхнего уровня используют этот контейнер.

**Сетки часто-используемые:**
- Hero: `grid-template-columns: 1fr 360px; gap: 60px` (текст / hero-изображение)
- Stats: `repeat(3, 1fr)` с вертикальными разделителями `border-left: 1px solid var(--rule)`
- Триптих (popular / FAQ / tip): `1.1fr 1fr 0.9fr; gap: 50px`
- Updates: `repeat(4, 1fr); gap: 28px`
- About: `1fr 0.9fr 320px; gap: 50px` (текст / иллюстрация / «Сейчас читают»)
- Footer: `1.4fr 1fr 1fr 1.2fr; gap: 50px`

### 5.4 Бордеры и плашки

- Линии-разделители: `1px solid var(--rule)` — между секциями верхнего уровня и внутри (между статьями списков, под/над линиями секций).
- **Карточек со скруглёнными углами ПОЧТИ нет.** Радиус только у круглых аватарок и одного-двух декоративных элементов. Прямые углы — часть журнального языка.
- Тени минимальные: `0 6px 16px rgba(34,26,20,0.12)` — только на круглой FAQ-фотке.

### 5.5 Декоративные знаки

- Маленькие точки-маркеры: `width: 8px; height: 8px; border-radius: 50%; background: var(--accent);`
- Декоративные римские цифры на карточках обновлений: `I, II, III, IV` в квадрате `44×44` с `var(--accent)` фоном и кремовым текстом, шрифт Cormorant italic.
- Номера глав в статье: `Глава 01`, `Глава 02` — Manrope 700, 11px, letter-spacing 0.22em, UPPERCASE, `--accent`.
- TOC-номера: `01, 02, …, 09` — Manrope 700, 11px.

---

## 6. Брендовые ассеты

В `assets/` положены файлы:

| Файл | Использование | Размер исходника |
|---|---|---|
| `hero-collage.png` | Главная и мобайл — hero справа; коллаж зерна+помол+бирюзовая дуга | 572×600, PNG с альфой |
| `faq-coffee.jpg` | Главная и мобайл — круглая мини-фотка над блоком «Часто спрашивают» | 800×800 |
| `about-coffee.png` | Главная и мобайл — иллюстрация в секции «О сайте» (жёлтая чашка со всплеском) | 380×500, PNG с альфой |
| `favicon.svg` | Favicon, аватары, PWA иконка — винная чашка на прозрачном | 48×48, SVG |
| `favicon-dark.svg` | Favicon для тёмной темы (на чёрной плашке в браузере) — терракотовая чашка | 48×48, SVG |

Все три фото — фирменные изображения сайта. **Бирюзовая дуга в `hero-collage.png` определяет цвет `--teal` в палитре** — это часть бренда, не случайность.

Когда понадобятся фото плантаций, портретов авторов, статейные фото — генерировать в том же духе (студийный фон, чистый кадр, мягкий тёплый свет). Авторские портреты — круг 54-80 px.

### 6.1 Логотип

Логотип — **знак (чашка) + wordmark «Все кофе»**. Используется во всех шапках и подвалах сайта.

**Знак** — минималистичная геометричная чашка с двумя whispы пара. Один SVG, один цвет (брендовый винный `#7a2a2a` на свету, терракотовый `#d97a4a` на тёмном).

**Wordmark** — Cormorant Garamond 500-600, кегль зависит от поверхности (см. ниже). Слово «кофе» — курсив + цвет акцента.

#### React/Astro-компонент `<CupGlyph>`

Положить в `src/components/CupGlyph.astro`:

```astro
---
interface Props {
  size?: number;
  color?: string;
}
const { size = 32, color = "currentColor" } = Astro.props;
---
<svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
  <ellipse cx="24" cy="36" rx="17" ry="3" fill={color} opacity="0.18" />
  <path d="M8 16 L8 28 Q8 35 24 35 Q40 35 40 28 L40 16 Z" stroke={color} stroke-width="2" fill="none" />
  <ellipse cx="24" cy="16" rx="16" ry="3" fill={color} />
  <path d="M20 10 Q 23 6 20 2" stroke={color} stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.55" />
  <path d="M28 10 Q 31 6 28 2" stroke={color} stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.4" />
  <path d="M40 19 Q 46 21 44 26 Q 42 30 40 30" stroke={color} stroke-width="2" fill="none" stroke-linecap="round" />
</svg>
```

#### Использование

**Шапка (десктоп) — `src/components/Masthead.astro`:**

```astro
<div class="vja-masthead">
  <div class="brand">
    <CupGlyph size={36} color="var(--accent)" />
    <div class="brand-text">
      <div class="name">Все&nbsp;<span class="em">кофе</span></div>
      <div class="tag">Большая энциклопедия кофе</div>
    </div>
  </div>
  …
</div>
```

CSS:
```css
.vja-masthead .brand { display: flex; align-items: center; gap: 12px; }
.vja-masthead .brand-text { display: flex; align-items: baseline; gap: 14px; }
.vja-masthead .brand .name {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 34px;
  letter-spacing: -0.01em;
  line-height: 1;
}
.vja-masthead .brand .name .em {
  font-style: italic;
  color: var(--accent);
  font-weight: 500;
}
```

**Шапка (мобайл):** `<CupGlyph size={24} color="var(--accent)" />` + wordmark 22px, всё в одной строке.

**Подвал — `src/components/Footer.astro`:**

```astro
<div class="brand">
  <div class="lockup">
    <CupGlyph size={40} color="var(--accent-2)" />
    <div class="n">Все&nbsp;<span class="em">кофе</span></div>
  </div>
  <p>© 2022—2026 · Большая энциклопедия кофе...</p>
</div>
```

CSS:
```css
.vja-foot .brand .lockup { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.vja-foot .brand .n {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: 36px;
  line-height: 1;
}
.vja-foot .brand .n .em {
  font-style: italic;
  color: var(--accent-2);  /* терракотовый, не винный — на тёмном фоне читается лучше */
  font-weight: 500;
}
```

#### Favicon

В `public/favicon.svg` положить SVG из `assets/favicon.svg`. В layout-е:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/svg+xml" href="/favicon-dark.svg" media="(prefers-color-scheme: dark)" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />  <!-- 180×180, экспортнуть из SVG -->
```

Для PWA-манифеста сгенерировать `192.png`, `512.png`, `maskable-512.png` из того же SVG (можно через `realfavicongenerator.net` или скриптом).

#### Правила использования

- ✅ Винный (`--accent`) — на всех светлых поверхностях (`--paper`, `--paper-2`, белый).
- ✅ Терракотовый (`--accent-2`) — только на тёмных поверхностях (`--ink` и темнее).
- ✅ Чашка всегда **слева** от wordmark, выровнена по центру высоты буквы.
- ✅ Минимальный размер чашки — **16 px**. Меньше — нечитаемо.
- ❌ Не разворачивать вертикально (чашка сверху, текст снизу) — нарушает иерархию.
- ❌ Не использовать акварельную чашку из `uploads/01-logo-vsecoffee.png` — это старый WP-сайт, не подходит по эстетике.
- ❌ Не менять цвет «кофе» в курсиве — это бренд-маркер.

---

## 7. Экраны

### 7.1 Главная — десктоп (`sources/variant-journal.jsx`)

**Структура секций сверху вниз:**

1. **Masthead** (`.vja-masthead`) — `grid: auto 1fr auto`. Слева — логотип «Все кофе» (Cormorant Garamond 600, 34px) рядом с теглайном «Большая энциклопедия кофе» (Manrope 10px, letter-spacing 0.32em, uppercase). Справа — поле поиска с подчёркиванием (без рамки) + `vk` / `tg` italic-серифом. Снизу — `border-bottom: 1px solid var(--rule)`. **Никаких дат, выпусков или редакционных подписей** — это сайт, не журнал.

2. **Nav** (`.vja-nav`) — горизонтальный список из 4-х ссылок, центрированный. Каждая ссылка: Cormorant Garamond 19px + надстрочная римская цифра `I/II/III/IV` (Manrope 9px). Активная — курсив + `--accent`.

3. **Hero** (`.vja-hero`) — grid 1fr 360px.
   - **Слева:** h1 в 3 строки «Жизнь / слишком хороша / — для плохого кофе.» (последняя строка курсив + accent), lede italic 21px. **Без kicker'ов сверху/снизу типа «Слово редакции · дата» или «Эссе номера — стр. 04»** — это сайт, не журнал.
   - **Справа:** `<aside class="art">` — фирменный коллаж `hero-collage.png` в `aspect-ratio: 572/600`. **Без баджей, без подписей — только изображение.**

4. **Stats** (`.vja-stats`) — 3 колонки с большими цифрами (Cormorant Garamond 88px) + единицей (italic small 22px + accent), описание ниже (Manrope 13px, ink-mute, max-width 240px). Разделители — `border-left: 1px solid var(--rule)`.

5. **Триптих** (`.vja-tript`) — 3 колонки.
   - **Популярное** (`.vja-pop`) — кикер-строка «Популярное» + справа стрелки слайдера `‹ 1 / 5 ›` (класс `.vja-arrow` — круглые 32×32 px с тонкой обводкой + серифные «‹»/«›»). Ниже — h2, фото-плейсхолдер, h3, blurb, подвал с «Читать далее →».
   - **FAQ** (`.vja-faq`) — круглая мини-фотка `faq-coffee.jpg` (84×84, border-radius 50%, лёгкая тень), kicker «Часто спрашивают», h2 «О кофе — коротко.», список из 5 вопросов в `<ul>`. Каждый `<li>`: `01`-индекс (accent) + текст вопроса + стрелка `→`.
   - **Совет** (`.vja-tip`) — тёмная карточка с `bg: var(--ink); color: var(--paper)`. Kicker «Полезно знать · № 14», h2 «Совет № 14», цитатный italic-текст, кнопка-плашка `↻ Другой совет` (outline, моно). коротко.», список из 5 вопросов в `<ul>`. Каждый `<li>`: `01`-индекс (accent) + текст вопроса + стрелка `→`.
   - **Совет** (`.vja-tip`) — тёмная карточка с `bg: var(--ink); color: var(--paper)`. Kicker «Полезно знать · № 14», h2 «Совет № 14», цитатный italic-текст, кнопка-плашка `↻ Другой совет` (outline, моно).

6. **Section head: «Обновления в разделах»** — h2 (Cormorant Garamond 56px) с курсивным «в разделах», тонкая горизонтальная линия-заполнитель посредине, большие круглые стрелки карусели `‹ 1 / 3 ›` (класс `.vja-arrow.lg` — 42×42 px) + ссылка «смотреть всё →».заполнитель посредине, ссылка «смотреть всё →».

7. **Updates** (`.vja-updates`) — 4 карточки в ряд. Каждая: фото-плейсхолдер сверху без декоративных меток, две meta-метки (категория + страна), h3, blurb, «Читать далее →». **Без номеров I/II/III поверх фото** — это рудимент журнального макета, на сайте мешает. углу (квадрат 44×44, accent bg, paper text), две meta-метки (категория + страна), h3, blurb, «Читать далее →».

8. **About** (`.vja-about`) — grid `1fr 0.9fr 320px`.
   - **Слева:** h2 «Чашка кофе как маленький ритуал.», 3 параграфа Cormorant 19px. **Drop-cap на первом параграфе** (Cormorant 600, 64px, float left, accent цвет). Без kicker'а сверху.
   - **Центр:** `<div class="visual">` — простое центрирование `about-coffee.png` шириной ~92%. **Никаких фонов, рамок, бирюзовых свечений или подписей «© vsecoffee / illustration».**
   - **Справа:** `<aside class="reading">` — h3 «Сейчас читают», нумерованный `<ol>` 01-04 с заголовком статьи + категорией (Manrope uppercase).

9. **Editors** (`.vja-eds`) — секция с `bg: var(--paper-2)`. Top: h2 «Всё об приготовлении кофе» + italic blurb справа. Grid: 3 карточки авторов — круглая аватарка 80×80 слева, справа — имя (Cormorant 22 600), роль (Manrope 10 uppercase accent), italic тема «В вопросах разбирается: …», ссылка «Читать материалы →».

10. **Footer** (`.vja-foot`) — `bg: var(--ink); color: rgba(244,238,226,.9)`. Grid `1.4fr 1fr 1fr 1.2fr`:
    - **Бренд + копирайт + контакты** (большое «Все кофе», параграф, инфо).
    - **Разделы** (список Cormorant 18px).
    - **Полезное** (список).
    - **Подписка** (italic-описание, инпут с подчёркиванием, прямоугольная кнопка accent).
    - Внизу — bottom-bar с mono-метками.

### 7.2 Главная — мобайл (`sources/mobile-journal.jsx`)

Ширина 375 px. Сохранять иерархию, но всё в одну колонку.

- **Top bar** — бургер + центрированный лого «Все кофе» (Cormorant 22) + 2 круглые иконки справа (search + vk, 34px outline).
- **Nav** — горизонтальный скролл с теми же 5 пунктами (I-V), активный курсив + accent.
- **Hero** — h1 44px, lede, hero-collage.png полной шириной без баджей и подписей.
- **Stats** — `2 × 2` grid, цифры по 64 px.
- **Popular** — стэк, фото сверху aspect 16/10.
- **FAQ** — круглая фотка 56 px + kicker + h2 в шапке секции, список вопросов ниже.
- **Tip** — отдельная тёмная карточка с боковыми отступами 18 px.
- **Updates** — 4 карточки в одну колонку, фото сверху + meta + заголовок + blurb + «Читать далее».
- **About** — h2 + параграфы с drop-cap. Иллюстрация `about-coffee.png` ~42% ширины (max 150px), по центру, без фона и рамки.
- **Reading now** — отдельная секция с нумерованным списком.
- **Editors** — фон `paper-2`, h2 + 3 author-карточки стэком.
- **Footer** — лого + параграф + инпут подписки (отдельная секция) + 2 колонки разделов + bottom-bar.

### 7.3 Внутренняя страница — «Кофе в Индии» (`sources/article-journal.jsx`)

Журнальный лонгрид с TOC справа.

1. **Masthead + Nav** — те же, но активная вкладка — «По странам» (нужно добавить пункт `V · По странам`).
2. **Breadcrumbs** (`.vja-art-crumbs`) — дом-иконка (accent) + цепочка `Главная › По странам › Индия`. Последний элемент — `--ink`, остальные — `--ink-mute`.
3. **Article header** (`.vja-art-header`):
   - Kicker-строка: «География · Азия» + тонкая линия + «Большое исследование номера».
   - H1 — 78 px серифом, с курсивным акцентом на бренде сорта `Monsooned Malabar`.
   - Deck (подзаголовок) — italic Cormorant 24 px, до 760 px ширины.
   - **Byline-row** — над линией: автор (аватар 54×54 + имя + роль uppercase accent) + meta-строка с буллетами (дата · обновлено · мин чтения · прочтений) + share-иконки (4 круглые 36 px outline).
4. **Hero figure** (`.vja-art-figure`) — широкое фото 16/8 с mono-«stamp» в углу + большим серифным placeholder-лейблом + figcaption italic.
5. **Country fact panel** (`.vja-art-fact`) — большая плашка `paper-2` с `border: 1px solid var(--rule)`. Grid `220px 1fr 1.1fr 1.1fr`:
   - **Колонка 1 — страна:** код `IN` (Cormorant 140 px, курсив + accent), регион uppercase, имя страны 32 px, «pin»-карточка с главным фактом.
   - **Колонка 2 — таблица фактов:** 6 строк `Место в мире / Доля на рынке / Основные виды / Обработка / Сезон сбора / Объём, год`. Каждая строка: label (Manrope 10 uppercase mute) → value (Cormorant 19, числа курсив + accent).
   - **Колонка 3 — интересные факты:** kicker + нумерованный список 01-04.
   - **Колонка 4 — карта:** заголовок + map-placeholder + легенда `Традиционные / Нетрадиционные зоны` со swatch-квадратами.
6. **Body + TOC** (`.vja-art-body`) — grid `1fr 320px; gap: 70px`.
   - **Body:** lede с drop-cap (Cormorant 22), параграфы Cormorant 19/1.65, h2 с надписью «Глава 01» серого moufeffr, h3, figure'ы, pull-quote (Cormorant italic 32 + большая кавычка 110 px opacity 0.25), callout-плашка (paper-2 + accent left-border + uppercase label), table (uppercase header + thin row dividers), expert-цитата (paper bg + аватар + italic + role-tag), photo-pair (2-up flat-lay).
   - **TOC (`.vja-art-toc`)** — sticky `top: 20px`:
     - Search input (paper, italic placeholder).
     - h4 «Содержание» kicker.
     - `<ol>` из 9 пунктов, нумерованных 01-09 (decimal-leading-zero). Активный пункт — italic accent + лёгкий accent bg.
     - Progress-плашка снизу: лейбл «Прогресс / 33%», тонкий bar (rule bg + accent fill 33%), «Глава 01 / 09 / ~17 мин осталось».
7. **Author bio** (`.vja-art-bio`) — grid `120px 1fr`. Большая аватарка + role kicker + h3 имя + параграф + ссылка «Все материалы автора →».
8. **Related** (`.vja-art-related`) — `bg: paper-2`. h2 «Читайте также — страны мира» + grid 3 карточек (фото с римской цифрой-номером в углу + meta + h3 + blurb).
9. **Footer** — тот же.

---

## 8. Интеракции и состояния

| Элемент | Поведение |
|---|---|
| Triptych «Популярное» | Слайдер из 5 материалов. Кнопки `‹ ›` в шапке карточки с коротким counter'ом `1 / 5`. Автопрогресс опционален. |
| Карусель «Обновления» | Стрелки в шапке секции листают пакеты по 4 карточки. Счётчик `1 / 3` — это страницы, не карточки. |
| FAQ-список | Каждый `<li>` — accordion. Клик раскрывает короткий ответ под вопросом (плавно, без скачка). |ен. |
| FAQ-список | Каждый `<li>` — accordion. Клик раскрывает короткий ответ под вопросом (плавно, без скачка). |
| «Совет» (tip-card) | Кнопка `↻ Другой совет` рандомизирует из массива советов (минимум 12). Плавный кросс-фейд текста. |
| TOC в статье | Sticky `top: 20px`. Активный пункт меняется по скроллу (IntersectionObserver на H2). Клик — smooth-scroll к секции. |
| Progress в TOC | Высчитывается по `window.scrollY / document.body.scrollHeight` на article-body. |
| Breadcrumbs / Nav | Стандартные ссылки. Hover — `text-decoration: underline; text-decoration-color: var(--accent);` |
| Кнопка «Подписаться» | Реальный submit на бэкенд + success-state (inline сообщение под инпутом, italic accent). |
| Карточки обновлений | Вся карточка кликабельна. Hover — фото `transform: scale(1.02); transition: .4s ease`. |
| Поиск (masthead) | Открывает overlay-поиск или ведёт на `/search?q=`. |

**Без анимаций-фейерверков.** Только тихие переходы: opacity, transform scale, цвет. Длительность 0.2-0.4s, easing `cubic-bezier(.2,.7,.3,1)` или `ease`.

---

## 9. Что нужно реализовать на стороне Astro

### Структура страниц

```
src/
  layouts/
    JournalLayout.astro       ← обёртка с masthead+nav+footer
    ArticleLayout.astro       ← дополнительно: breadcrumbs, header, TOC
  components/
    Masthead.astro
    Nav.astro                 ← принимает active prop
    Footer.astro
    Hero.astro
    Stats.astro
    Triptych/
      PopularSlider.astro     ← интерактив через Astro Islands (React/Vue/Alpine)
      FAQList.astro           ← accordion островок
      TipCard.astro           ← swap-tip островок
    Updates.astro
    AboutSection.astro
    ReadingNow.astro
    Editors.astro
  components/article/
    Breadcrumbs.astro
    ArticleHeader.astro
    CountryFactPanel.astro    ← конфиг через frontmatter MDX
    TOC.astro                 ← sticky island с scroll-spy
    PullQuote.astro
    Callout.astro
    ExpertQuote.astro
    PhotoPair.astro
    RelatedArticles.astro
    AuthorBio.astro
  pages/
    index.astro
    po-stranam/
      [slug].astro            ← рендер MDX
  content/
    countries/
      indiya.mdx              ← фронтматтер + body
      keniya.mdx
      ...
  styles/
    tokens.css                ← все CSS-переменные из §5.1
    base.css                  ← typography + reset
```

### Контент через MDX

Статейная страница «Кофе в Индии» хорошо ложится на content collections. Пример frontmatter:

```yaml
---
title: "Кофе в Индии: история, регионы, сорта Monsooned Malabar и Mysore"
deck: "Страна, где зерно три месяца дышит юго-западным муссоном..."
country: "Индия"
countryCode: "IN"
region: "Южная Азия"
author: "taisiya-zhukova"
publishedAt: 2025-08-22
updatedAt: 2026-05-22
readingTime: 25
hero: "/images/po-stranam/indiya-hero.jpg"
heroCaption: "Кофейные террасы региона Чикмагалур, штат Карнатака."
heroCredit: "Фото: Анна Зернова · 2024 г."
fact:
  rank: 6
  marketShare: "4,5%"
  varieties: "Арабика 40%, Робуста 60%"
  processing: ["Сухой", "Влажный", "Муссонный"]
  season: "Ноябрь — март"
  production: "350 тыс. тонн"
  facts:
    - "Единственная страна с уникальной муссонной обработкой кофе..."
    - "Кофе в Индию контрабандой привёз святой Баба Будан..."
    - "98% индийских кофейных хозяйств — мелкие..."
mainBrand: "Monsooned Malabar — единственный в мире."
toc:
  - "Регионы выращивания кофе в Индии"
  - "Виды и сорта индийского кофе: арабика и робуста"
  - ...
---
```

В теле MDX — использовать наши кастомные компоненты как:

```mdx
## Регионы выращивания <a id="regiony"></a>

Большая часть индийского кофе...

<Figure src="/images/.../plantation.jpg" caption="..." credit="..." />

<PullQuote>На Карнатаку приходится больше 70% всего индийского кофе...</PullQuote>

<Callout label="☕ Полезно знать">
  Карнатакский Чикмагалур...
</Callout>

<ExpertQuote author="maksim-smetanin">
  Индийский Monsooned Malabar — единственный в мире кофе...
</ExpertQuote>

<PhotoPair
  src1="/images/.../arabica.jpg" alt1="Зерно арабики"
  src2="/images/.../robusta.jpg" alt2="Зерно робусты"
/>
```

### Респонсив

JSX-прототипы зафиксированы на 1280 и 375 px — это «якоря». Между ними реализовать плавный переход через `clamp()` для типографики и `auto-fill` / медиа-запросы для сеток. Брейкпоинты:

- `≥ 1280` — десктоп (как в `variant-journal.jsx`)
- `1024-1279` — десктоп компактный (паддинги 40 px, hero h1 → 64px)
- `768-1023` — планшет (триптих → 1+2 или стэк, updates → 2×2)
- `≤ 767` — мобайл (как в `mobile-journal.jsx`)

---

## 10. Что НЕ реализовано в прототипах (надо сделать на проде)

- Реальный поиск (autocomplete API)
- Реальная подписка (форма + API)
- IntersectionObserver-логика для активного TOC
- Smooth-scroll к якорям (`scroll-behavior: smooth` глобально)
- Open Graph / SEO-метаданные на каждой странице
- A11y: aria-labels, focus-visible стили, semantic landmarks
- Тёмная тема — не делается на этом этапе, оставлено на потом
- Загрузка фото для статей (плейсхолдеры в JSX — это `<div>` с штриховкой, заменить на `<Image>` Astro)

---

## 11. Следующие экраны (в очереди после)

- Страница рецепта (например, Cappuccino) — с пошаговой инструкцией, weight chart, photo-grid
- Страница категории «По странам» — каталог стран с миниатюрами и фильтрами
- Страница «О сайте / О команде» — расширенная редакционная
- Страница автора со всеми материалами

Дизайн будет добавлен отдельно — `article-journal.jsx` уже задаёт паттерны (callout, expert-quote, photo-pair, table, pull-quote), на них можно опираться.

---

## 12. Файлы в этом пакете

```
design_handoff_variant_a/
├── README.md                        ← общая спецификация (читать первым)
├── UPDATES.md                       ← журнал изменений с предыдущей передачи
├── assets/
│   ├── hero-collage.png             ← бренд: hero-коллаж с дугой
│   ├── faq-coffee.jpg               ← бренд: FAQ-фото
│   ├── about-coffee.png             ← бренд: иллюстрация О сайте
│   ├── favicon.svg                  ← бренд: чашка-знак (винная)
│   └── favicon-dark.svg             ← бренд: чашка-знак (терракотовая, для тёмной темы)
└── sources/
    ├── variant-journal.jsx          ← Главная (десктоп)
    ├── mobile-journal.jsx           ← Главная (мобайл 375)
    ├── article-journal.jsx          ← Статья «Кофе в Индии» (обновлена — см. UPDATES.md)
    ├── category-countries.jsx       ← Каталог «Кофе по странам» (новая страница)
    ├── logo-variants.jsx            ← Логотип — light + dark + favicon
    ├── logo-sheet.jsx               ← Каталог логотипа (для просмотра)
    └── placeholders.jsx             ← PhotoPH + BeanMark + Rule + CupGlyph
```

---

## 13. Как отдать в Claude Code

1. **Скачайте всю папку `design_handoff_variant_a`** одним архивом (карточка для скачивания ниже).
2. **Откройте чат с Claude Code** в нужном Astro-проекте.
3. **Загрузите архив** в чат через прикрепление файлов (или распакуйте папку в корень проекта и попросите Claude прочитать её).
4. **Промпт:**

   > Вот дизайн-пакет в HTML/JSX и README с полной спецификацией дизайна `vsecoffee`. Реализуй эти экраны в моём Astro-проекте, следуя README.
   >
   > Порядок:
   > 1. Сначала прочитай **`README.md`** целиком — там цветовая палитра, шрифты, размеры, сетки, правила.
   > 2. Затем заведи дизайн-токены (`src/styles/tokens.css`) и базовую типографику (`src/styles/base.css`) из раздела «5. Дизайн-токены».
   > 3. Создай компонент `<CupGlyph>` и `<Masthead>` / `<Footer>` (раздел 6.1). Подключи favicon из `assets/favicon.svg`.
   > 4. Реализуй главную (`pages/index.astro`) — используй `sources/variant-journal.jsx` как референс по разметке и стилям. CSS из `VJA_CSS` можешь копировать как есть, только переименуй классы под свои конвенции (или оставь как есть).
   > 5. Адаптируй главную под мобильный (`sources/mobile-journal.jsx`) — медиа-запросы по брейкпоинтам из раздела «Респонсив».
   > 6. Реализуй страницу статьи (`sources/article-journal.jsx`) как `pages/po-stranam/[slug].astro` + MDX content collections (раздел «Контент через MDX»).
   > 7. Не переноси «журнальные» рудименты, перечисленные в **разделе 4.1**.

5. Claude Code сам прочитает все JSX-файлы и README, и начнёт реализацию по шагам. Если будет неясности — он спросит.

### Если что-то поменяется в дизайне

Я (дизайнер) пересоберу пакет и пришлю новый архив. В Claude Code можно сказать:
> «Я обновил дизайн-пакет — вот свежий архив. Сравни с тем, что у тебя сейчас, и обнови только то, что изменилось».
