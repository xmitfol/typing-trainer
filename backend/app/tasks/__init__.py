"""Async background tasks (ARQ workers + APScheduler in-process).

Архитектура по T5 (TSD §10):
- APScheduler — лёгкие cron'ы (cleanup анонимов 3д, daily reports)
- ARQ workers — тяжёлые long-running (recurring payments, GDPR export)

Sprint 2: cleanup_anonymous_sessions (ADR-001)
Sprint 6: process_subscription_renewal (ADR-005 hybrid)
Sprint 9: export_user_data, hard_delete_pending
"""
