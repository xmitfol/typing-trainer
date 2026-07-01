# Risk Register

> **Owner:** Ника (Project Manager)
> **Updated:** weekly (пятница)
> **Source:** initial extracted из [01_PRD.md](01_PRD.md) §9 + [02_TSD.md](02_TSD.md) + [03_IMPL_PLAN.md](03_IMPL_PLAN.md) §14

## Severity / Probability

- **Severity**: CRITICAL (релиз не состоится) / HIGH (часть фич не работает) / MED (UX страдает) / LOW (минор)
- **Probability**: 🔴 high (>50%) / 🟡 med (10-50%) / 🟢 low (<10%)
- **Status**: 🔍 open / 🛠️ mitigating / ✅ closed / ⏸️ accepted

## Active

| # | Risk | Sev | Prob | Status | Owner | Mitigation | Trigger to re-eval |
|---|---|---|---|---|---|---|---|
| R-001 | ~~GitHub аккаунт Ивана заблокирован~~ | HIGH | — | ✅ closed | PO | **РАЗБЛОКИРОВАН 2026-06-11** через GitHub support + 2FA. ADR-004 миграция стала optional. Push 43 коммитов на `origin/integration/new-shell` выполнен, PR #25 создан. | — |
| R-002 | YooKassa может отклонить recurring-схему в РФ | HIGH | 🟡 | 🛠️ mitigating | Борис + PO | **Hybrid из [ADR-005](decisions/ADR-005.md)**: code умеет оба flow (recurring + email-reminder). S6.0 — ранняя YK заявка в Sprint 6 day 1. T-003 — если не одобрят к day 5 → switch на manual+email для MVP. | T-003 (Sprint 6 day 5) или T-004 (после beta) |
| R-003 | Backend разработчик заболеет на 1+ неделю | MED | 🟡 | ⏸️ accepted | Ника | Документация каждого sprint'а в `docs/.sessions/sprints/sprint-N/` | Реальная болезнь / отпуск |
| R-004 | 152-ФЗ — хостинг должен быть в РФ | HIGH | 🟢 | 🛠️ mitigating | Сергей | Yandex Cloud / Selectel выбраны — обе RU. IP не plain в логах. | Compliance review перед Sprint 10 |
| R-005 | Пользователи теряют localStorage до миграции на сервер | HIGH | 🟡 | 🔍 open | Алекс | Phase 2.1 — обязательный prompt «зарегистрируйся» в первые 5 минут с явным CTA | Sprint 2 — guest→account migration |
| R-006 | Backend крашится во время оплаты | CRITICAL | 🟢 | 🛠️ mitigating | Борис | Idempotency keys, webhook retries, eventual consistency через ARQ | Sprint 7 — payment lifecycle test |
| R-007 | Атаки на signup (бот-регистрация) | MED | 🟡 | 🛠️ mitigating (**validated E2E 2026-06-24**) | Сергей | **Self-hosted anti-bot из [ADR-006](decisions/ADR-006.md)** (решение PO): honeypot + proof-of-work + IP rate-limit. **Проверено реальным E2E-прогоном (Sprint 1 gate 8/8)**: PoW решается в браузере и проходит капчу; бот без решения / honeypot → отсекается; replay → reject. Рычаг под атаку — `CAPTCHA_POW_DIFFICULTY`. Probability понижена 🔴→🟡: механизм работает, остаётся остаточный риск bot-rate под реальной нагрузкой (пока нет prod-трафика). | Если bot-rate >5%/день при difficulty=22 → возврат внешнего провайдера (новый ADR) |
| R-008 | Backend p95 latency не укладывается в 200ms | MED | 🟡 | 🔍 open | Борис + Дима | k6 load test в Sprint 10. Если не укладываемся — кеш Redis на hot paths | Sprint 10 load testing |
| R-009 | GDPR-проверки от EU юзеров до compliance ready | LOW | 🟢 | ⏸️ accepted | Сергей | В v1.0 не открываем регистрацию для не-RU IP — GeoIP block на Nginx | Если решим запускать EU маркетинг |
| R-010 | Конкурент (Соло) запускает SaaS быстрее | LOW | 🟡 | ⏸️ accepted | Марина | Мы быстрее (план 11-12 недель), UX лучше | Marketing-research еженедельно |
| R-011 | Yandex Cloud API breaking change | LOW | 🟢 | 🛠️ mitigating | Дима | Multi-cloud через Terraform + **GH mirror как escape hatch** (ADR-004) — полная git-история всегда доступна на стороне | Annual review |
| R-012 | Email-провайдер (Я360) лимиты при росте трафика | MED | 🟡 | 🔍 open | Дима | Monitor отправки, при >2000/day переход на Mailgun/SendGrid | Sprint 8 — analytics покажет рост |

## Closed (last 30 days)

| # | Risk | Date closed | How |
|---|---|---|---|
| R-001 | GitHub аккаунт `xmitfol` заблокирован | 2026-06-11 | GitHub support разблокировал + PO прошёл 2FA. Push 43 коммитов + PR #25 успешно. |

## Accepted (живём с этим)

| # | Risk | Why accepted |
|---|---|---|
| R-003 | Заболевание Бориса | Documentation как mitigation, hot-swap бесконечно дорог |
| R-009 | GDPR до compliance | Маркетинг изначально RU-only |
| R-010 | Конкурент Соло | Не критично — рынок не overlapping |
| R-011 | Yandex Cloud breaking | Low probability, Terraform даёт escape hatch |

---

## Weekly check protocol

Каждую пятницу Ника:

1. Прошлась по списку — что закрыли (`status: ✅ closed`)
2. Появились новые? — добавить с R-NNN номером
3. Изменилась severity или probability? — обновить + delta в weekly digest
4. Триггер eval'а сработал? — провести полную переоценку
5. Mitigation steps выполнены? — отметить или пометить как просроченные

## Trigger thresholds

- Любой риск переходит в **CRITICAL** → немедленная эскалация PO + Slack
- > 3 рисков HIGH без mitigation в текущем sprint'е → red flag в weekly digest
- Risk-N status = 🔴 high probability более 2 недель → пересмотр в retro

---

**Changelog**

| Дата | Что | Кто |
|---|---|---|
| 2026-06-06 | Initial register с 12 рисками | Ника + Клод (handoff) |
| 2026-06-06 | R-001 переведён в active mitigation (ADR-004 migration), R-011 mitigation усилен через GH mirror | Клод |
| 2026-06-07 | R-002 переведён в active mitigation через ADR-005 (Hybrid + ранняя YK заявка S6.0) | Клод |
| 2026-06-11 | R-001 закрыт — GitHub разблокирован, push 43 коммитов + PR #25 успешно | PO + Клод |
| 2026-06-11 | R-007 → 🛠️ mitigating через ADR-006 (self-hosted anti-bot вместо SmartCaptcha, решение PO). Email-интеграция (Я360) отложена PO: на dev — mailhog, реальные SMTP-креды deferred; R-012 без изменений (касается prod-масштаба). | PO + Клод |
| 2026-06-24 | R-007 mitigation **validated E2E** (Sprint 1 gate 8/8): PoW+honeypot работают, бот без решения отсекается. Probability 🔴→🟡. Оставлен mitigating (не closed): re-eval-триггер по bot-rate жив до появления prod-трафика. | Ника |
