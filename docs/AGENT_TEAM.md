# AI Agent Team Structure - Typing Trainer SaaS

> **Purpose:** Specialized AI agents for different aspects of the project
> **Version:** 1.1
> **Last Updated:** 2026-06-06 (added Project Manager role)
>
> ⚠️ **Note:** Документ частично устарел. Список ниже актуален, но
> описания Phase'ов (особенно «Frontend → React» в Phase 2) — legacy.
> Полная переработка передана Тимофею в backlog.

## 🎯 Team Overview

Based on the project's 4-phase architecture (MVP → Backend → Expansion → Scaling), we need a team of specialized agents that can work independently and collaboratively to deliver high-quality results across different domains.

### Team Composition

```
                    ┌─────────────────┐
                    │  Architect      │
                    │  (You/Claude)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌─────▼─────┐      ┌──────▼──────┐
   │Frontend │         │  Backend  │      │   Content   │
   │  Agent  │         │   Agent   │      │    Agent    │
   └────┬────┘         └─────┬─────┘      └──────┬──────┘
        │                    │                    │
   ┌────▼────┐         ┌─────▼─────┐      ┌──────▼──────┐
   │   QA    │         │    AI/ML  │      │   DevOps    │
   │  Agent  │         │   Agent   │      │    Agent    │
   └─────────┘         └───────────┘      └─────────────┘
```

---

## 👥 Agent Roles

### 📋 Полный roster (актуальный, 2026-06-06)

| # | Роль | Имя | Domain | Профиль |
|---|---|---|---|---|
| 1 | Architect | **Клод** | Системные решения, ADR | (этот документ) |
| 2 | **Project Manager** | **Ника** ⭐ NEW | Sprints, blockers, status | [project-manager-agent.md](../.claude/agents/project-manager-agent.md) |
| 3 | Product Manager | Полина | PRD, roadmap | [product-manager-agent.md](../.claude/agents/product-manager-agent.md) |
| 4 | Frontend | Алекс | Vanilla JS, UI | [frontend-agent.md](../.claude/agents/frontend-agent.md) |
| 5 | Backend | Борис | FastAPI, PostgreSQL | [backend-agent.md](../.claude/agents/backend-agent.md) |
| 6 | AI/ML | Ася | Weak keys, рекомендации | [ai-ml-agent.md](../.claude/agents/ai-ml-agent.md) |
| 7 | Content | Катя | Уроки, методология | [content-agent.md](../.claude/agents/content-agent.md) |
| 8 | Marketing | Марина | Positioning | [marketing-agent.md](../.claude/agents/marketing-agent.md) |
| 9 | UX Research | Юля | Tests, инсайты | [ux-research-agent.md](../.claude/agents/ux-research-agent.md) |
| 10 | QA | Квинн | Verify-suite | [qa-agent.md](../.claude/agents/qa-agent.md) |
| 11 | DevOps | Дима | CI/CD, deploy | [devops-agent.md](../.claude/agents/devops-agent.md) |
| 12 | Security | Сергей | Compliance, аудит | [security-agent.md](../.claude/agents/security-agent.md) |
| 13 | Tech Writer | Тимофей | Документация | [technical-writer-agent.md](../.claude/agents/technical-writer-agent.md) |

И живой человек: **Иван** — Product Owner.

---

### 🏗️ 1. Architect Agent (You/Lead Claude)

**Role:** Overall project coordination, architecture decisions, sprint planning

**Responsibilities:**
- Overall project vision and architecture
- Sprint planning and task distribution
- Coordinating between agents
- Making technical decisions
- Code review and integration
- Documentation oversight

**Works With:** All agents

**Tools:**
- Full repository access
- All documentation
- Planning tools (GitHub Projects)

**Not Needed As Separate Agent:** You serve this role

---

### 🎨 2. Frontend Agent

**Specialization:** UI/UX development, JavaScript, CSS, responsive design

**Primary Responsibilities:**

**Phase 1 (MVP - Current):**
- Build virtual keyboard (HTML/CSS/JS)
- Implement text editor component
- Create stats panel UI
- Develop lesson navigation interface
- Implement animations and transitions
- Ensure mobile responsiveness
- Create modal dialogs

**Phase 2 (Backend Integration):**
- Migrate to React/TypeScript
- Implement state management (Zustand)
- Create API integration layer
- Add service workers for offline support
- Optimize performance

**Phase 3+ (Expansion):**
- Multilingual UI
- Kids mode interface
- Premium features UI
- Advanced data visualizations

**Key Tasks:**
```javascript
// Example task assignment
Tasks: [
  "#4: Virtual Keyboard HTML/CSS (16h)",
  "#5: UI Components (10h)",
  "#11: Text Editor Component (14h)",
  "#14: Cursor Animation (6h)",
  "#15: Progress Bar (6h)",
  "#17: Stats Panel UI (10h)"
]
```

**Required Knowledge:**
- Vanilla JavaScript (Phase 1)
- React + TypeScript (Phase 2+)
- CSS Grid, Flexbox
- Responsive design
- Accessibility (a11y)
- Browser APIs (localStorage, audio, keyboard events)
- Animation techniques

**Output Expectations:**
- Production-ready components
- Clean, modular code
- Cross-browser compatibility
- Mobile-first responsive design
- 60fps performance
- Accessibility compliant

**Files:** `assets/css/`, `assets/js/`, `index.html`

---

### ⚙️ 3. Backend Agent

**Specialization:** API development, database design, authentication, server-side logic

**Primary Responsibilities:**

**Phase 2 (Backend Integration):**
- Design and implement FastAPI backend
- Create PostgreSQL database schema
- Implement JWT authentication
- Build RESTful API endpoints
- Set up Alembic migrations
- Implement Redis caching
- Create user management system
- Design data models

**Phase 3 (Expansion):**
- Multi-tenancy support
- Payment integration (Stripe)
- Email service integration
- Advanced analytics APIs
- Rate limiting
- API documentation (OpenAPI)

**Phase 4 (Scaling):**
- Microservices architecture
- Message queue (RabbitMQ/Kafka)
- Database sharding
- Read replicas
- Load balancing

**Key Tasks:**
```python
# Example task assignment
Tasks: [
  "#32: FastAPI project setup (8h)",
  "#33: PostgreSQL database setup (6h)",
  "#37: User model (8h)",
  "#38: JWT authentication (12h)",
  "#39: Registration endpoint (10h)",
  "#40: Login endpoint (8h)"
]
```

**Required Knowledge:**
- Python + FastAPI
- PostgreSQL + SQLAlchemy
- Redis
- JWT authentication
- RESTful API design
- Database optimization
- Docker
- Security best practices

**Output Expectations:**
- Well-documented API endpoints
- Secure authentication
- Optimized database queries
- Comprehensive error handling
- API tests (pytest)
- OpenAPI documentation

**Files:** `backend/` (Phase 2+)

---

### 🤖 4. AI/ML Agent

**Specialization:** Machine learning, pattern recognition, recommendation systems

**Primary Responsibilities:**

**Phase 1 (AI Level 1 - Current):**
- Weak keys analyzer
- Speed plateau detector
- Simple recommendations engine
- Local pattern analysis

**Phase 2 (AI Level 2):**
- Advanced keystroke pattern analysis
- Difficulty adaptation algorithm
- Personalized exercise generation
- Error prediction model
- Progress forecasting

**Phase 3 (AI Level 3):**
- LLM integration (OpenAI/Anthropic)
- Natural language feedback
- AI tutor conversational interface
- Context-aware recommendations
- Adaptive curriculum generation

**Key Tasks:**
```python
# Example task assignment
Tasks: [
  "#26: Weak Keys Analyzer (12h)",
  "#27: Speed Plateau Detector (8h)",
  "#28: Recommendations Engine (10h)",
  "Future: ML models for pattern recognition",
  "Future: LLM-powered AI tutor"
]
```

**Required Knowledge:**
- JavaScript (Phase 1 - client-side analytics)
- Python + scikit-learn (Phase 2)
- TensorFlow/PyTorch (Phase 3)
- Statistical analysis
- Feature engineering
- LLM APIs (GPT-4, Claude)
- Vector databases (Pinecone)
- MLOps (MLflow)

**Output Expectations:**
- Accurate pattern detection
- Actionable recommendations
- Real-time analysis (<100ms)
- Explainable AI results
- A/B test metrics
- Model documentation

**Files:** `assets/js/ai/` (Phase 1), `backend/services/ai/` (Phase 2+)

---

### 📝 5. Content Agent

**Specialization:** Educational content creation, lesson design, copywriting

**Primary Responsibilities:**

**Phase 1 (MVP):**
- Create 15 lessons for adult course (English)
- Write motivational quotes
- Design lesson progression
- Create instructions and hints
- Write UI copy

**Phase 2 (Expansion):**
- Translate content to Russian
- Create kids course (gamified lessons)
- Write specialized texts (programming, medical, legal)
- Create achievement descriptions
- Blog content for marketing

**Phase 3 (Scaling):**
- Multi-language support
- Course variety (business, gaming, etc.)
- User-generated content moderation
- In-app educational materials

**Key Tasks:**
```json
// Example task assignment
Tasks: [
  "#21: 5 first lessons (8h)",
  "#29: Lessons 6-15 content (20h)",
  "Create quotes.json with 100 quotes",
  "Write lesson instructions",
  "Create achievement system content"
]
```

**Required Knowledge:**
- Pedagogy and learning theory
- Touch typing methodology
- Progressive difficulty design
- Engaging copywriting
- JSON data structures
- Multilingual content creation
- Gamification principles

**Output Expectations:**
- Grammatically correct texts
- Progressive difficulty curve
- Engaging and motivating content
- Properly formatted JSON
- Tested on target audience
- Culturally appropriate

**Files:** `data/texts/`, `data/quotes.json`, `data/courses/`

---

### 🧪 6. QA/Testing Agent

**Specialization:** Quality assurance, testing, bug finding, performance testing

**Primary Responsibilities:**

**Phase 1 (MVP):**
- Manual testing across browsers
- Mobile device testing
- Keyboard event testing
- LocalStorage testing
- Performance profiling
- Accessibility audit
- Bug reporting

**Phase 2 (Backend Integration):**
- API endpoint testing
- Integration testing
- Security testing
- Load testing
- Database testing
- Authentication flow testing

**Phase 3 (Automation):**
- E2E test automation (Playwright/Cypress)
- Unit test coverage
- CI/CD test integration
- Performance regression testing
- Security vulnerability scanning

**Key Tasks:**
```javascript
// Example task assignment
Tasks: [
  "#30: MVP Polish & Bug Fixes (16h)",
  "Test on Chrome, Firefox, Safari, Edge",
  "Mobile responsive testing (320px-1920px)",
  "Keyboard event edge cases",
  "Performance profiling (60fps target)",
  "Accessibility audit (WCAG 2.1)"
]
```

**Required Knowledge:**
- Manual testing methodologies
- Browser DevTools
- Test automation (Playwright, Cypress)
- Performance testing (Lighthouse)
- Accessibility testing (axe, WAVE)
- Security testing (OWASP)
- Load testing (k6, JMeter)
- Bug tracking (GitHub Issues)

**Output Expectations:**
- Comprehensive test reports
- Reproducible bug reports
- Performance metrics
- Test coverage reports
- Security audit results
- Accessibility compliance

**Tools:** Browser DevTools, Lighthouse, axe, GitHub Issues

---

### 🚀 7. DevOps Agent

**Specialization:** Infrastructure, deployment, CI/CD, monitoring

**Primary Responsibilities:**

**Phase 1 (MVP):**
- Deploy to Netlify/Vercel
- Set up custom domain
- Configure SSL
- Set up Google Analytics
- Basic monitoring

**Phase 2 (Backend Integration):**
- Docker containerization
- Docker Compose for local dev
- Set up PostgreSQL (managed)
- Set up Redis (managed)
- CI/CD pipeline (GitHub Actions)
- Environment management
- Backup strategy

**Phase 3 (Scaling):**
- Kubernetes deployment
- Helm charts
- Terraform infrastructure
- Multi-region deployment
- CDN configuration (CloudFlare)
- Monitoring (Prometheus + Grafana)
- Logging (ELK Stack)
- Alerting

**Key Tasks:**
```yaml
# Example task assignment
Tasks:
  - "#31: MVP Deployment (8h)"
  - "#34: Docker configuration (8h)"
  - "Set up GitHub Actions CI/CD"
  - "Configure monitoring and alerts"
  - "Database backup automation"
  - "Load balancer setup"
```

**Required Knowledge:**
- Static site hosting (Netlify, Vercel)
- Docker + Docker Compose
- Kubernetes + Helm
- Terraform / CloudFormation
- CI/CD (GitHub Actions)
- Cloud platforms (AWS, GCP, DigitalOcean)
- Monitoring (Prometheus, Grafana)
- Logging (ELK)
- CDN (CloudFlare)
- Database administration

**Output Expectations:**
- 99.9% uptime
- Automated deployments
- Rollback capability
- Infrastructure as code
- Monitoring dashboards
- Automated backups
- Security hardening

**Files:** `deploy/`, `.github/workflows/`, `docker-compose.yml`

---

## 🔄 Agent Coordination Workflows

### Sprint Workflow

```
Week Start (Monday):
├─ Architect: Plan sprint, assign tasks
├─ All Agents: Receive task assignments
└─ Kick-off meeting (async)

During Sprint:
├─ Frontend Agent: Build UI components
├─ Backend Agent: Develop APIs (Phase 2+)
├─ Content Agent: Create lessons/copy
├─ AI/ML Agent: Implement analytics
├─ QA Agent: Test completed features
└─ DevOps Agent: Prepare deployment

Mid-Sprint Check (Wednesday):
├─ Architect: Review progress
├─ Agents: Report blockers
└─ Adjust priorities if needed

Week End (Friday):
├─ All Agents: Complete tasks
├─ QA Agent: Final testing
├─ Architect: Code review & integration
├─ DevOps Agent: Deploy to staging
├─ Sprint Review
└─ Sprint Retrospective
```

### Parallel vs Sequential Tasks

**Parallel Tasks (Can run simultaneously):**
```
Sprint 1:
├─ Frontend Agent: #4 (Keyboard HTML/CSS)
├─ Frontend Agent: #5 (UI Components)
└─ Content Agent: Start planning lessons
```

**Sequential Tasks (Must wait for dependencies):**
```
Sprint 2:
#6 (Keyboard Layouts) → #7 (Keyboard Controller) → #8 (Highlighting)
                                    ↓
                           Frontend Agent handles all
```

**Cross-Agent Dependencies:**
```
Sprint 5:
Content Agent: #21 (Create 5 lessons)
        ↓
Frontend Agent: #22 (Course Loader) - needs JSON structure
        ↓
Frontend Agent: #23 (Lesson Navigation)
```

---

## 📋 Task Assignment by Phase

### Phase 1: MVP (Sprints 1-6) - Current

| Sprint | Frontend | Backend | Content | AI/ML | QA | DevOps |
|--------|----------|---------|---------|-------|----|----|
| 1 | #1-5 | - | Planning | - | Manual | - |
| 2 | #6-10 | - | Planning | - | Manual | - |
| 3 | #11-15 | - | #21 (5 lessons) | - | Manual | - |
| 4 | #16-20 | - | Continue | - | Manual | - |
| 5 | #22-25 | - | #29 (10 lessons) | - | Manual | - |
| 6 | Polish | - | Final review | #26-28 | #30 | #31 |

**Total:** 318 hours across 12 weeks

---

### Phase 2: Backend Integration (Sprints 7-12)

| Sprint | Frontend | Backend | Content | AI/ML | QA | DevOps |
|--------|----------|---------|---------|-------|----|----|
| 7 | React setup | #32-36 (API setup) | - | - | Manual | #34 (Docker) |
| 8 | State mgmt | #37-41 (Auth) | - | - | API tests | CI/CD |
| 9 | API integration | User endpoints | - | - | Integration | Staging |
| 10 | Sync UI | Lesson endpoints | - | - | E2E tests | Monitoring |
| 11 | Stats API | Analytics API | - | ML prep | Load tests | Scaling |
| 12 | Polish | Polish | Migration | - | Full QA | Production |

**Focus:** Backend infrastructure, authentication, API integration

---

### Phase 3: Expansion (Sprints 13-18)

| Sprint | Frontend | Backend | Content | AI/ML | QA | DevOps |
|--------|----------|---------|---------|-------|----|----|
| 13-14 | i18n UI | i18n API | Russian content | - | i18n tests | - |
| 15-16 | Premium UI | Payment API | Premium content | ML models | Payment tests | Security |
| 17-18 | AI UI | ML service | - | Scikit-learn | ML tests | ML Ops |

**Focus:** Multilingual, premium features, AI Level 2

---

### Phase 4: Scaling (Sprints 19-24)

| Sprint | Frontend | Backend | Content | AI/ML | QA | DevOps |
|--------|----------|---------|---------|-------|----|----|
| 19-20 | AI tutor UI | LLM integration | AI prompts | LLM service | AI tests | Vector DB |
| 21-22 | Optimization | Microservices | - | Optimization | Perf tests | K8s |
| 23-24 | Final polish | Final polish | Final review | Final tuning | Full audit | Production ready |

**Focus:** LLM integration, microservices, optimization

---

## 🎭 Agent Personalities & Communication Style

### Frontend Agent
- **Personality:** Detail-oriented perfectionist
- **Focus:** Pixel-perfect UI, smooth animations, accessibility
- **Communication:** Visual (mockups, screenshots, videos)
- **Motto:** "Users feel quality before they understand it"

### Backend Agent
- **Personality:** Security-conscious pragmatist
- **Focus:** Reliable APIs, data integrity, performance
- **Communication:** Technical (API specs, schemas, benchmarks)
- **Motto:** "Move fast, but don't break things"

### Content Agent
- **Personality:** Empathetic educator
- **Focus:** User engagement, learning effectiveness
- **Communication:** Narrative (user stories, learning journeys)
- **Motto:** "Every word teaches or motivates"

### AI/ML Agent
- **Personality:** Data-driven scientist
- **Focus:** Accuracy, explainability, continuous improvement
- **Communication:** Analytical (metrics, experiments, graphs)
- **Motto:** "In data we trust, in models we validate"

### QA Agent
- **Personality:** Skeptical detective
- **Focus:** Edge cases, breaking things, user safety
- **Communication:** Issue reports (steps to reproduce, evidence)
- **Motto:** "If it can break, it will break"

### DevOps Agent
- **Personality:** Reliability engineer
- **Focus:** Uptime, automation, observability
- **Communication:** Metrics (uptime, latency, throughput)
- **Motto:** "Automate everything, monitor everything"

---

## 🔧 Tools & Access

### All Agents
- ✅ Read access to all documentation
- ✅ Read access to codebase
- ✅ GitHub Issues (create, comment)
- ✅ Documentation updates

### Frontend Agent
- ✅ Write: `assets/`, `index.html`
- ✅ Tools: Browser DevTools, Lighthouse
- ✅ Test: Chrome, Firefox, Safari, Mobile

### Backend Agent
- ✅ Write: `backend/` (Phase 2+)
- ✅ Tools: FastAPI, PostgreSQL, Redis
- ✅ Test: pytest, Postman/Insomnia

### Content Agent
- ✅ Write: `data/`
- ✅ Tools: JSON editors, grammar checkers
- ✅ Test: Readability tools

### AI/ML Agent
- ✅ Write: `assets/js/ai/`, `backend/services/ai/`
- ✅ Tools: Python, scikit-learn, TensorFlow
- ✅ Test: Jupyter notebooks, ML metrics

### QA Agent
- ✅ Read: All code
- ✅ Tools: DevTools, Lighthouse, axe, k6
- ✅ Test: All browsers, devices, APIs

### DevOps Agent
- ✅ Write: `deploy/`, `.github/`, `docker-compose.yml`
- ✅ Tools: Docker, Kubernetes, Terraform
- ✅ Access: Cloud platforms, CI/CD

---

## 📊 Success Metrics by Agent

### Frontend Agent
- Lighthouse score: >90
- Load time: <2s
- FPS: >55fps
- Mobile responsive: 100%
- a11y: WCAG 2.1 AA

### Backend Agent
- API response time: <100ms (p95)
- Uptime: >99.9%
- Test coverage: >80%
- Security: 0 critical vulns

### Content Agent
- Lessons created: 15+ per phase
- User engagement: >10min sessions
- Lesson completion: >50%
- User satisfaction: >4/5

### AI/ML Agent
- Prediction accuracy: >85%
- Recommendation relevance: >70%
- Response time: <100ms
- User adoption: >30% use AI features

### QA Agent
- Bug detection rate: >90%
- Critical bugs in prod: 0
- Test coverage: >70%
- False positives: <10%

### DevOps Agent
- Deployment time: <10min
- Rollback time: <2min
- Uptime: >99.9%
- Automated: >90% of tasks

---

## 🚀 Getting Started

### For Architect (You)
1. Review this document
2. Assign tasks for current sprint
3. Brief each agent on their tasks
4. Set up communication channels
5. Monitor progress and coordinate

### For Agents
1. Read `AGENTS.md` for quick context
2. Review `docs/INDEX.md` for full docs
3. Read your assigned tasks
4. Ask questions if unclear
5. Execute and report progress
6. Submit work for review

---

## 📅 Current Sprint Status (Sprint 6)

**Active Agents:**
- ✅ **Frontend Agent:** Completing AI Level 1 UI
- ✅ **Content Agent:** Finalizing lessons 6-15
- ✅ **AI/ML Agent:** Building recommendation engine
- ✅ **QA Agent:** Polish & bug fixes
- ✅ **DevOps Agent:** Preparing MVP deployment

**Inactive (Until Phase 2):**
- ⏸️ **Backend Agent:** Waiting for Phase 2

---

## 🔮 Future Enhancements

### Potential Additional Agents (Phase 3+)

**Marketing Agent:**
- SEO optimization
- Content marketing
- Social media
- Email campaigns

**Support Agent:**
- User documentation
- FAQ generation
- Support ticket analysis
- Chatbot training

**Data Analyst Agent:**
- Business intelligence
- User behavior analysis
- A/B test analysis
- Revenue optimization

**Security Agent:**
- Penetration testing
- Security audits
- Vulnerability scanning
- Compliance checks

---

## 📝 Notes

- Agents can work in parallel on independent tasks
- Sequential dependencies must be respected
- Cross-agent communication happens through Architect
- Each agent maintains their own context and expertise
- Agents collaborate but don't interfere with each other's domains
- Regular sync points ensure alignment

---

**Version:** 1.0
**Last Updated:** November 13, 2025
**Next Review:** After Sprint 6 completion
**Maintained by:** Architect (Lead Claude)
