# Architecture Decision Records (ADR)

Архитектурные решения, которые меняют контракт или поведение системы и
требуют истории. Формат — короткий, immutable: каждое решение в отдельном
файле, изменение → новый ADR (Superseded by ADR-N).

## Активные

| # | Title | Status | Date |
|---|---|---|---|
| [001](ADR-001.md) | Anonymous guest lifecycle = 3 дня | ✅ Accepted | 2026-06-06 |
| [002](ADR-002.md) | Profile mutation policy (Q5 closure) | ✅ Accepted | 2026-06-06 |
| [003](ADR-003.md) | Family plan — read-only parental visibility | ✅ Accepted | 2026-06-06 |
| [004](ADR-004.md) | Single-vendor infra: YC as code+build+host (GitHub mirror) | ✅ Accepted | 2026-06-06 |
| [005](ADR-005.md) | YooKassa recurring fallback strategy (Hybrid) | ✅ Accepted | 2026-06-07 |
| [006](ADR-006.md) | Self-hosted anti-bot вместо Yandex SmartCaptcha | ✅ Accepted | 2026-06-11 |

## Заброшенные / Superseded

| # | Title | Superseded by | Date |
|---|---|---|---|
| [005-DRAFT](ADR-005-DRAFT.md) | YooKassa recurring fallback strategy (draft Ники) | [ADR-005](ADR-005.md) | 2026-06-07 |

## Шаблон

См. [TEMPLATE.md](TEMPLATE.md). Структура ADR: Context → Decision → Consequences → Alternatives Considered.
