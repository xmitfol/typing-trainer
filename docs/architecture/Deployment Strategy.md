**🚀**** Deployment Strategy**
**Typing Trainer SaaS - ****Стратегия**** ****развертывания**
**Версия:** 1.0
**Дата:** 09 октября 2025

**📋**** Содержание**







**🌍**** Обзор окружений**
**Окружения**
Development (Local)
      ↓
   Staging
      ↓
  Production
**Development (Локальное):**
Где: Localhost
Кто: Разработчики
Цель: Разработка и отладка
URL: localhost:8000 или Live Server
**Staging (Тестовое):**
Где: Netlify/Vercel (MVP) или Cloud (Backend)
Кто: Команда + тестировщики
Цель: QA и интеграционное тестирование
URL: staging.typingtrainer.com
**Production (Боевое):**
Где: Netlify/Vercel (Frontend) + AWS/DO (Backend)
Кто: Все пользователи
Цель: Реальный продукт
URL: typingtrainer.com

**🎯**** MVP DEPLOYMENT (Фаза 1)**
**Цель:** Deploy статического сайта с нулевыми затратами
**Option A: Netlify (Рекомендуется)**
**Преимущества:**
✅ Бесплатный план (100GB bandwidth/мес)
✅ Automatic HTTPS
✅ Continuous deployment из Git
✅ Instant rollback
✅ Form submissions (для feedback)
✅ Custom domain
✅ CDN из коробки
**Setup Steps:**
**1. Подготовка проекта**
# Структура для Netlify
typing-trainer/
├── index.html           # Entry point
├── assets/
│   ├── css/
│   ├── js/
│   └── fonts/
├── data/
│   └── courses/
├── _redirects          # URL rewrites
└── netlify.toml        # Configuration
**netlify.toml:**
[build]
  publish = "."
  command = "echo 'No build step needed'"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "/data/*"
  [headers.values]
    Cache-Control = "public, max-age=3600"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
**_redirects:**
# SPA fallback
/*    /index.html   200
**2. Deploy через Git**
# 1. Создать Git репозиторий
git init
git add .
git commit -m "Initial commit"

# 2. Push на GitHub
git remote add origin https://github.com/username/typing-trainer.git
git push -u origin main

# 3. Подключить к Netlify
# - Зайти на netlify.com
# - New site from Git
# - Choose GitHub repository
# - Deploy!
**3. Custom Domain**
# В Netlify Dashboard:
# 1. Domain settings
# 2. Add custom domain
# 3. Update DNS records:

# A Record:
typingtrainer.com → 75.2.60.5 (Netlify IP)

# CNAME Record:
www.typingtrainer.com → your-site.netlify.app
**DNS Configuration:**
Type    Name    Value                        TTL
A       @       75.2.60.5                    3600
CNAME   www     your-site.netlify.app        3600
**4. Environment Variables**
# Netlify Dashboard → Site settings → Environment variables
# (для будущих API keys)

ENVIRONMENT=production
API_URL=https://api.typingtrainer.com

**Option B: Vercel (Альтернатива)**
**Преимущества:**
✅ Аналогично Netlify
✅ Лучше интеграция с Next.js (для v2.0)
✅ Edge Functions
**vercel.json:**
{
  "buildCommand": "echo 'Static site'",
  "outputDirectory": ".",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}

**Option C: GitHub Pages (Бесплатно, но базово)**
**github-pages-deploy.yml:**
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
**Ограничения:**
Нет серверной логики
Медленнее Netlify/Vercel
Нет edge CDN

**🔧**** BACKEND DEPLOYMENT (****Фаза**** 2)**
**Цель****:** Deploy FastAPI backend + PostgreSQL
**Архитектура**** ****Фазы**** 2**
┌────────────────────────────────────┐
│  Frontend (Netlify/Vercel)        │
│  typingtrainer.com                 │
└───────────┬────────────────────────┘
            │ HTTPS
            ▼
┌────────────────────────────────────┐
│  API Gateway / Load Balancer       │
│  api.typingtrainer.com             │
└───────────┬────────────────────────┘
            │
      ┌─────┴─────┐
      │           │
      ▼           ▼
┌─────────┐  ┌─────────┐
│ API-1   │  │ API-2   │  (Auto-scaling)
└─────────┘  └─────────┘
      │           │
      └─────┬─────┘
            │
            ▼
┌────────────────────────────────────┐
│  PostgreSQL (Managed)              │
│  + Redis Cache                     │
└────────────────────────────────────┘

**Option A: DigitalOcean App Platform (****Рекомендуется****)**
**Почему DO:**
✅ Простота (проще чем AWS)
✅ Предсказуемые цены
✅ Managed PostgreSQL included
✅ Automatic HTTPS
✅ $200 credit для старта
**Pricing (начальный):**
- App Platform Basic: $5/month
- PostgreSQL Dev DB: $15/month  
- Total: $20/month
**Deployment Steps:**
**1. Подготовка Backend**
**Dockerfile:**
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY ./app ./app
COPY ./alembic ./alembic
COPY alembic.ini .

# Run migrations and start
CMD alembic upgrade head && \
    uvicorn app.main:app --host 0.0.0.0 --port 8000
**requirements.txt:**
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9
redis==5.0.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic-settings==2.1.0
**docker-compose.yml (****для**** ****локальной**** ****разработки****):**
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/typing_trainer
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./app:/app/app
      - ./alembic:/app/alembic

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=typing_trainer
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
**2. Deploy ****на**** DigitalOcean**
**Via Dashboard:**
Create new App
Connect GitHub repo
Select branch: main
Configure: 
Type: Web Service
Dockerfile: Auto-detected
Port: 8000
Health check: /health
**Via CLI (doctl):**
# Install doctl
brew install doctl

# Authenticate
doctl auth init

# Create app
doctl apps create --spec .do/app.yaml

# Monitor deployment
doctl apps list
doctl apps logs <app-id>
**.do/app.yaml:**
name: typing-trainer-api
region: nyc

services:
- name: api
  github:
    repo: username/typing-trainer-backend
    branch: main
  dockerfile_path: Dockerfile

  http_port: 8000

  health_check:
    http_path: /health

  instance_count: 1
  instance_size_slug: basic-xxs  # $5/month

  envs:
  - key: DATABASE_URL
    scope: RUN_TIME
    value: ${db.DATABASE_URL}
  - key: REDIS_URL
    scope: RUN_TIME
    value: ${redis.REDIS_URL}
  - key: SECRET_KEY
    scope: RUN_TIME
    type: SECRET
    value: <generate-secret>

databases:
- name: db
  engine: PG
  version: "15"
  size: db-s-dev-database  # $15/month
  num_nodes: 1

- name: redis
  engine: REDIS
  version: "7"
**3. Database Migrations**
# Local → Staging migration
alembic upgrade head

# Production migration (via DO console or CLI)
doctl apps run <app-id> -- alembic upgrade head

**Option B: AWS (для масштабирования)**
**Архитектура****:**
Route 53 (DNS)
    ↓
CloudFront (CDN)
    ↓
ALB (Load Balancer)
    ↓
ECS Fargate (Containers)
    ↓
RDS PostgreSQL + ElastiCache Redis
**Terraform setup (infrastructure as code):**
# main.tf
provider "aws" {
  region = "us-east-1"
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "typing-trainer-cluster"
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier           = "typing-trainer-db"
  engine              = "postgres"
  engine_version      = "15.4"
  instance_class      = "db.t3.micro"
  allocated_storage   = 20

  db_name  = "typing_trainer"
  username = var.db_username
  password = var.db_password

  skip_final_snapshot = true
}

# ... more resources
**Estimated costs (****начальный****):**
- ECS Fargate (0.25 vCPU, 0.5GB): $15/month
- RDS t3.micro: $15/month
- ElastiCache t3.micro: $12/month
- ALB: $16/month
- Total: ~$58/month

**🔄**** CI/CD PIPELINE**
**GitHub Actions Workflow**
**.github/workflows/deploy.yml:**
name: Deploy

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  # Frontend deployment
  deploy-frontend:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: '.'
          production-deploy: true
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

  # Backend deployment (Фаза 2)
  test-backend:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest

      - name: Run tests
        run: pytest

  deploy-backend:
    needs: test-backend
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to DigitalOcean
        uses: digitalocean/app_action@v1
        with:
          app_name: typing-trainer-api
          token: ${{ secrets.DIGITALOCEAN_TOKEN }}

**📊**** MONITORING & ROLLBACK**
**Monitoring Stack**
**Tools:**
**Uptime monitoring:** UptimeRobot (free)
**Error tracking:** Sentry (free tier)
**Analytics:** Google Analytics 4
**Performance:** Lighthouse CI
**Sentry Setup:**
// frontend/main.js
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://...@sentry.io/...",
  environment: "production",
  tracesSampleRate: 0.1,
});

// Catch errors
window.addEventListener('error', (event) => {
  Sentry.captureException(event.error);
});
**Lighthouse CI:**
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://staging.typingtrainer.com
          uploadArtifacts: true
**Rollback Strategy**
**Netlify (****автоматически****):**
Каждый deploy сохраняется
Rollback за 1 клик в Dashboard
Или через CLI: netlify rollback
**DigitalOcean:**
# Посмотреть deployments
doctl apps deployments list <app-id>

# Rollback к предыдущему
doctl apps deployments create <app-id> --previous
**Manual rollback:**
# Revert Git commit
git revert HEAD
git push

# Force deploy previous commit
git reset --hard HEAD~1
git push --force

**✅ Pre-Launch Checklist**
**MVP Launch (****Фаза**** 1)**
[ ] **Functionality**
[ ] Все 15 уроков работают
[ ] Статистика корректна
[ ] Прогресс сохраняется
[ ] Нет критических багов
[ ] **Performance**
[ ] Lighthouse score >90
[ ] Page load <2s
[ ] FPS >55 при печати
[ ] Works offline (ServiceWorker)
[ ] **SEO**
[ ] Meta tags заполнены
[ ] Open Graph изображения
[ ] Sitemap.xml
[ ] Robots.txt
[ ] **Analytics**
[ ] Google Analytics настроен
[ ] Event tracking работает
[ ] Goals configured
[ ] **Security**
[ ] HTTPS enabled
[ ] Security headers
[ ] CSP policy
[ ] No XSS vulnerabilities
[ ] **Legal**
[ ] Privacy Policy
[ ] Terms of Service
[ ] Cookie consent (GDPR)
[ ] Contact page
[ ] **Deployment**
[ ] Production URL works
[ ] Custom domain configured
[ ] CDN enabled
[ ] Backups configured

**📈**** Post-Launch Monitoring**
**Week 1**
[ ] Daily uptime checks
[ ] Monitor error rates (Sentry)
[ ] Check analytics daily
[ ] Respond to user feedback
**Month 1**
[ ] Weekly performance audits
[ ] Review metrics vs targets
[ ] Plan improvements
[ ] Iterate based on data

**Статус:** ✅ Готов к deployment
**Первый deploy:** После завершения Sprint 6
**Дата:** 09 октября 2025
