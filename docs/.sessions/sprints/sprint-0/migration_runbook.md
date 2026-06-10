# Migration Runbook — GitHub → Yandex Cloud Code Repo + GitHub mirror

> **Trigger**: B-001 (GitHub `xmitfol` suspended)
> **Decision**: [ADR-004](../../../spec/backend/decisions/ADR-004.md) Single-vendor infra
> **Executor**: Дима (DevOps)
> **Owner**: Ника (PM, координация)
> **Date**: 2026-06-06
> **Estimate**: 3-4 часа основной переезд, +1 день на CI pipeline в Sprint 0

## 0. Pre-flight check (PO action required)

Что нужно от Ивана **до начала** миграции:

- [ ] **Yandex Cloud аккаунт + billing** активирован (если ещё нет — Sprint 0 task S0.2 двигается сюда)
- [ ] **Yandex Cloud organization** создана с правом создавать репо
- [ ] **Новый GitHub email** — отдельный от `xmitfol@...` чтобы не словить сразу повторный бан (рекомендую gmail/yandex.mail без связи с заблокированным)
- [ ] **Решение по visibility** новой YC репо: private (рекомендую) или public
- [ ] **Решение по имени** YC репо: `typing-trainer` (рекомендую) или `typing-trainer-saas`
- [ ] **Дима получает IAM-role** на YC организацию: `editor` минимум, `admin` для CI setup

## 1. YC Code Repo — primary setup (~30 мин)

```bash
# 1.1. Установить YC CLI локально (если нет)
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
yc init  # привязать к organization

# 1.2. Создать репозиторий в YC Code Repo
yc code-repository create \
  --name typing-trainer \
  --visibility private \
  --description "Russian-first typing trainer SaaS (vanilla JS + FastAPI)"

# 1.3. Получить SSH URL и clone-команду
yc code-repository get typing-trainer --format json | jq -r .ssh_url
# Например: ssh://git@yc-code.cloud.yandex.net:1234/typing-trainer.git

# 1.4. Настроить SSH ключи в YC
yc iam key add-public --service-account-id <Дима SA ID> --public-key-file ~/.ssh/id_ed25519.pub
```

**Verify**: `git ls-remote ssh://...` отвечает (но репо пустой — это OK).

## 2. Push 37 коммитов на YC (10 мин)

В рабочем каталоге `c:\Dropbox\Project\saas\typing-trainer`:

```bash
# 2.1. Проверить локальное состояние
git status                                    # должно быть clean
git log --oneline integration/new-shell | wc -l   # ~50 строк
git branch -a                                 # local branches list

# 2.2. Добавить YC remote и сделать основным
git remote rename origin github-blocked       # переименовать старый
git remote add origin ssh://git@yc-code.cloud.yandex.net:1234/typing-trainer.git

# 2.3. Push всех веток + тегов
git push origin --all --tags
# Должно отправить: master, integration/new-shell, timofey/documentation (если есть)
```

**Verify**:
- `yc code-repository get typing-trainer` показывает branches
- В YC console видна полная история (37 коммитов сверху)
- `git fetch origin` работает

## 3. Защита branch'ей (15 мин)

```bash
# 3.1. Через YC CLI / web UI
yc code-repository branch-protection create \
  --repository typing-trainer \
  --branch master \
  --require-reviews 1 \
  --require-checks lint,test

yc code-repository branch-protection create \
  --repository typing-trainer \
  --branch backend/main \
  --require-reviews 1 \
  --require-checks lint,test
```

**Verify**: Попытка прямого push на master отклоняется с ошибкой.

## 4. Cloud Build pipeline (заменяет GitHub Actions) — Sprint 0 deliverable

Создать `.cloudbuild/lint-and-test.yaml` в корне репо:

```yaml
# Минимальный pipeline для Sprint 0 gate
trigger:
  push:
    branches: [master, "backend/**", "integration/**"]

steps:
  - name: lint-and-test
    container: python:3.12-slim
    commands:
      - pip install ruff mypy pytest
      - ruff check .
      - mypy backend/app/ || true   # warning-only пока
      - pytest backend/tests/ || true   # stub до реальных тестов
```

**Verify**: Push любой коммит → YC Cloud Build показывает зелёный/красный статус.

## 5. GitHub mirror setup (~45 мин)

```bash
# 5.1. PO создаёт новый GitHub аккаунт (НОВЫЙ email)
#     Например: typing-trainer-bot@... (бот-аккаунт, не личный)

# 5.2. Создаёт пустой private repo `typing-trainer-mirror`

# 5.3. Локально:
git remote add github-mirror git@github.com:<new-account>/typing-trainer-mirror.git
git push github-mirror --mirror

# 5.4. Cloud Build добавляет post-build step для авто-mirror
```

Добавить в `.cloudbuild/lint-and-test.yaml`:

```yaml
  - name: mirror-to-github
    if: branch == 'master'
    container: alpine/git
    commands:
      - git push --mirror git@github.com:<new-account>/typing-trainer-mirror.git
    secrets:
      - github_deploy_key
```

GitHub deploy key создаётся в YC Lockbox (или env), приватный SSH-key в GitHub repo settings.

**Verify**: Push в YC primary → через 1-2 мин mirror на GitHub синхронизирован.

## 6. Update team artifacts (~30 мин, Ника делает)

- [x] [risks.md](../../../spec/backend/risks.md) — R-001 переходит в `🛠️ mitigating → ✅ closed` после успешной миграции, R-011 mitigation усилен
- [x] [sprint-0/board.md](board.md) — S0.5 переписан под YC Cloud Build
- [x] [decisions/README.md](../../../spec/backend/decisions/README.md) — ADR-004 добавлен
- [ ] [02_TSD.md §6 Deployment](../../../spec/backend/02_TSD.md) — упомянуть YC Code Repo в архитектуре
- [ ] [03_IMPL_PLAN.md §2](../../../spec/backend/03_IMPL_PLAN.md) — S0.5 task description обновлён
- [ ] [README.md](../../nika_onboarding.md) — пометить, что migration выполнена

## 7. Команды получают доступ

- Дима (DevOps) — admin на YC organization
- Борис (Backend) — developer access на репо
- Алекс (Frontend) — developer access на репо
- Клод (Architect) — read access + review rights
- Ника (PM) — read access + project boards access
- Остальные — по необходимости

## 8. Post-migration verify (Дима + Ника)

- [ ] `git clone ssh://...yc.../typing-trainer.git` на чистой машине работает
- [ ] Cloud Build runs зелёные на dummy-коммите
- [ ] Push на mirror идёт автоматически (тест: 2 коммита подряд)
- [ ] Все 37 локальных коммитов видны в YC
- [ ] Branch protection блокирует прямой push на master
- [ ] Ника обновляет sprint-0 board: S0.5 → DONE
- [ ] Ника обновляет risks.md: R-001 → ✅ closed
- [ ] Ника пишет короткий incident-style summary в weekly digest 2026-W23

## 9. Rollback plan (если что-то пошло не так)

```bash
# Откат к локальному состоянию — ничего не потеряем
git remote rm origin
git remote rm github-mirror
git remote rename github-blocked origin  # вернуть имя
# Локальные коммиты на месте, ничего не удалено
```

## 10. Bookmarks для команды

- YC Code Repo: `https://console.cloud.yandex.ru/folders/<folder>/code-repository/typing-trainer`
- YC Cloud Build: `https://console.cloud.yandex.ru/folders/<folder>/cloud-build`
- GitHub mirror: `https://github.com/<new-account>/typing-trainer-mirror`
- Local working tree: `c:\Dropbox\Project\saas\typing-trainer`

---

**Estimated total**: 3-4 часа (с учётом 30 мин на pre-flight от PO).
**Critical path blockers**: Yandex Cloud org access (PO), новый GH email (PO).
**Не блокирует**: содержательную работу команды — все могут продолжать локально пока миграция идёт.
