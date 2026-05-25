# Quick Guide for AI Agents

> **Purpose:** Fast reference for AI agents working on this project
> **Full Documentation:** See [`docs/INDEX.md`](docs/INDEX.md)

## 🎯 Project Summary

**Russian Keyboard Typing Trainer** - Web-based SaaS application for learning touch typing

**Current Phase:** MVP (Phase 1, Sprints 1-6)
**Status:** ~60% complete
**Tech:** Vanilla JavaScript, HTML5, CSS3, LocalStorage
**No build system** - Pure static files

## 📁 Key Files

```
typing-trainer/
├── index.html              # Main app (ENTRY POINT)
├── CLAUDE.md               # Project guidelines (READ FIRST)
├── assets/
│   ├── css/
│   │   ├── main.css       # Main styles
│   │   ├── keyboard.css   # Virtual keyboard styles
│   │   └── components.css # UI components
│   └── js/
│       ├── main.js        # TypingTrainer class (CORE LOGIC)
│       ├── keyboard.js    # Keyboard controller
│       ├── stats.js       # Statistics calculator
│       └── utils.js       # Utilities + StorageUtils
├── config/
│   └── settings.js        # APP_CONFIG (ALL CONFIGURATION)
├── data/
│   ├── quotes.json        # Motivational quotes
│   └── texts/ru.json      # Training texts by level
└── docs/                  # Full documentation
    ├── INDEX.md           # Documentation index
    ├── architecture/      # System architecture
    ├── planning/          # Sprint plans
    ├── requirements/      # Technical specs
    └── assets/            # Design mockups (27 images)
```

## 🔑 Key Concepts

### 1. Module Pattern
Each JS file is a self-contained module with no external dependencies.

### 2. Config-Driven Design
All settings in `config/settings.js`:
```javascript
// Access config
const value = Settings.get('path.to.setting', defaultValue);

// Example
const targetWPM = Settings.get('levels.medium.targetWPM', 40);
```

### 3. Color-Coded Keyboard
Each finger has a unique color:
- 🟣 Pink: Pinky fingers
- 🟠 Orange: Ring fingers
- 🟢 Green: Middle fingers
- 🔵 Cyan/Blue: Index fingers
- 🟪 Purple: Thumbs (space bar)

### 4. 6 Difficulty Levels
1. Pinky (мизинец) - 15+ WPM
2. Ring (безымянный) - 25+ WPM
3. Middle (средний) - 40+ WPM
4. Index Left (указ. левый) - 60+ WPM
5. Index Right (указ. правый) - 80+ WPM
6. Thumb (большой) - 100+ WPM

### 5. LocalStorage Persistence
No backend yet - all data stored in browser:
- Best results per level
- User settings
- Test history (last 100)

## 🚀 Development

### Start Local Server
```bash
# Python (recommended)
python -m http.server 8000

# Then open http://localhost:8000
```

### Test Checklist
- [ ] Chrome, Firefox, Safari
- [ ] Mobile responsive (320px - 1920px)
- [ ] Keyboard highlights correctly
- [ ] Stats calculate accurately
- [ ] No console errors
- [ ] 60fps during typing

## 📋 Common Tasks

### Add New Training Text
**File:** `data/texts/ru.json`
```json
{
  "medium": [
    "Your new training text here...",
    "Another text..."
  ]
}
```

### Change Difficulty Level Settings
**File:** `config/settings.js`
```javascript
levels: {
  medium: {
    name: 'Средний',
    targetWPM: 40,
    errorThreshold: 5,
    color: '#00b894'
  }
}
```

### Modify Finger Colors
**File:** `config/settings.js`
```javascript
keyboard: {
  fingerColors: {
    pinky: '#ff7675',
    ring: '#fdcb6e',
    middle: '#00b894',
    // ...
  }
}
```

### Add Statistics
**File:** `assets/js/stats.js`
- Extend `StatsCalculator` class
- Add calculation method
- Update display in stats panel

## 📚 Documentation Structure

### Architecture (Full System Design)
- **[System Architecture](docs/architecture/Архитектура%20системы.md)** - Complete architecture overview
- Frontend Architecture - Component structure
- Backend Architecture - API design (future)
- Database Schema - Data models (future)
- AI/ML Architecture - 3-level AI implementation
- Deployment Strategy - Hosting & DevOps

### Planning (Sprint Breakdown)
- **[Implementation Plan](docs/planning/Детальный%20план%20реализации.md)** - 24 sprints, detailed tasks
- Course Master Plan - Lesson structure
- TODO List - Current tasks

### Requirements (Specifications)
- **[Technical Specification](docs/requirements/Техническое%20задание%20SaaS%20Клавиатурный%20Тренажер.md)** - Complete tech spec
- GitHub Templates - Issue templates

## 🎯 Current Sprint (Sprint 6)

**Goal:** AI Level 1 + Polish + Deploy MVP

**Key Tasks:**
- [x] Weak keys analyzer (identify problem keys)
- [ ] Speed plateau detector
- [ ] Simple recommendations engine
- [ ] Complete lessons 6-15 content
- [ ] Bug fixes & polish
- [ ] Deploy to production (Netlify/Vercel)

**Status:** In progress
**Deadline:** End of week 12

## 🔮 Next Steps (After MVP)

**Phase 2: Backend Integration** (Sprints 7-12)
- FastAPI backend
- PostgreSQL database
- User authentication (JWT)
- Cloud sync
- API endpoints

**Phase 3: Expansion** (Sprints 13-18)
- Multilingual support (English)
- Kids mode
- Premium features
- Enhanced analytics

**Phase 4: Scaling** (Sprints 19-24)
- AI Level 3 (LLM integration)
- Microservices architecture
- Performance optimization
- Production monitoring

## ⚠️ Important Rules

1. **NO external dependencies** - Keep vanilla JS
2. **NO build system** - Static files only (for now)
3. **Mobile-first** - Always test responsive
4. **60fps** - Performance is critical
5. **Read CLAUDE.md** - Contains project-specific rules
6. **Check config** - Don't hardcode values
7. **Test on real devices** - Not just DevTools
8. **Document changes** - Update relevant .md files

## 🆘 Need Help?

1. **CLAUDE.md** - Project guidelines
2. **docs/INDEX.md** - Full documentation index
3. **Technical Spec** - Complete requirements
4. **Implementation Plan** - Detailed sprint tasks

## 📊 Project Metrics

**MVP Completion:** ~60% (Sprint 6 of 6)
**Total Tasks:** 31 tasks planned
**Completed:** ~20 tasks
**Time Spent:** ~200 hours (estimated)
**Time Remaining:** ~118 hours to MVP completion

**Performance Targets:**
- Page load: <2s
- Time to Interactive: <3s
- FPS during typing: >55fps
- Lighthouse score: >90

**Quality Targets:**
- Bug rate: <5 critical bugs
- Test coverage: Manual (automated in Phase 2)
- Code review: 100% of changes
- Browser support: Chrome 80+, Firefox 75+, Safari 13+

---

**Last Updated:** November 13, 2025
**Maintained by:** Development Team
**See also:** [docs/INDEX.md](docs/INDEX.md) for complete documentation
