# Sprint 2 · Active Blockers

> Active blockers logged here. Resolved → moved to `## Resolved` ниже.
> **Status**: pending start (ждёт Sprint 1 gate)

## Active

— нет (sprint не стартовал)

## Predicted (preview risks для Sprint 2)

| # | Что | Owner для разблокировки | When triggers | Mitigation |
|---|---|---|---|---|
| P2-1 | Yandex OAuth `client_id` / `secret` не получены к day 1 | PO (Иван) | На Sprint 2 kickoff проверить env | Заказать на ~Friday Sprint 1; fallback — VK first |
| P2-2 | VK OAuth `client_id` / `secret` не получены к day 3 | PO (Иван) | На день 2 day-of-day check | Заказать одновременно с Yandex |
| P2-3 | Sprint 1 gate провален → Sprint 2 заблокирован | Борис + Ника (retro) | После Sprint 1 demo | Перенос S2.1-S2.4 на week 3, всё остальное скользит |
| P2-4 | localStorage shape от Алекса оказался расширен после S2.5 implementation | Алекс | На day 3 review | Schema `localStorage_schema.md` уже зафиксирован — Алекс не должен менять без ADR. Если новый ключ — добавить колонку в migrate-guest payload, не rework. |

## Resolved

— нет (sprint не стартовал)

---

## Escalation protocol

1. Блокер появился → Ника фиксирует здесь с timestamp + owner
2. Через 4 часа без движения → escalation (Ника пишет в standup + связывается с owner)
3. Через 24 часа → escalation к PO (weekly digest или ad-hoc)
4. Resolved — переместить в `## Resolved` с date+resolution-note
