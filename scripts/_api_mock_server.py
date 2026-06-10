"""
Lightweight FastAPI mock-сервер для тестирования api-client.js против
реального HTTP-контракта без поднятия полного backend'а.

Endpoints зеркалируют TSD §3 — возвращают hardcoded responses, но shape
матчит документацию. Используется в `verify_api_client_mock.py`.

Usage:
    pip install fastapi uvicorn
    python scripts/_api_mock_server.py     # :9001
"""
from typing import Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="typing-trainer mock", version="0.1.0-mock")

# CORS: разрешаем все origins для browser-based verify
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Mock state (in-memory) ─────────────────────────────────────────
_state: dict[str, Any] = {
    "profile": {
        "id": "mock-uuid-1",
        "email": "mock@test.local",
        "name": "Mock User",
        "audience": "adult",
        "gender": "m",
        "character": "anna",
        "language": "ru",
        "created_at": "2026-06-07T10:00:00Z",
    },
    "settings": {
        "keyboard_type": "classic",
        "keyboard_layout": "standard",
        "finger_hint": True,
        "key_sound": False,
        "metronome": False,
        "task_zoom": 100,
        "hide_indicator": False,
        "preview_off": False,
    },
    "progress": {},
    "history": [],
}


# ─── Schemas ────────────────────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str
    app: str
    env: str
    version: str


class ProfilePatch(BaseModel):
    name: str | None = None
    gender: str | None = None
    character: str | None = None
    language: str | None = None


class SettingsPatch(BaseModel):
    keyboard_type: str | None = None
    keyboard_layout: str | None = None
    finger_hint: bool | None = None
    key_sound: bool | None = None
    metronome: bool | None = None
    task_zoom: int | None = None
    hide_indicator: bool | None = None
    preview_off: bool | None = None


class AttemptRequest(BaseModel):
    tier: str
    lesson_num: int
    wpm: int
    accuracy: int
    duration_ms: int
    errors: int = 0
    rhythm: int | None = None
    completed_at: str | None = None


class SignupRequest(BaseModel):
    name: str
    audience: str
    character: str
    language: str = "ru"
    email: str | None = None
    password: str | None = None


# ─── Endpoints ──────────────────────────────────────────────────────
@app.get("/api/v1/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        app="typing-trainer-mock",
        env="dev",
        version="0.1.0-mock",
    )


@app.get("/api/v1/me")
async def get_me() -> dict[str, Any]:
    return _state["profile"]


@app.patch("/api/v1/me")
async def patch_me(patch: ProfilePatch) -> dict[str, Any]:
    update = {k: v for k, v in patch.model_dump().items() if v is not None}
    _state["profile"].update(update)
    return _state["profile"]


@app.get("/api/v1/me/settings")
async def get_settings() -> dict[str, Any]:
    return _state["settings"]


@app.patch("/api/v1/me/settings")
async def patch_settings(patch: SettingsPatch) -> dict[str, Any]:
    update = {k: v for k, v in patch.model_dump().items() if v is not None}
    _state["settings"].update(update)
    return _state["settings"]


@app.get("/api/v1/me/progress")
async def get_progress() -> dict[str, Any]:
    return _state["progress"]


@app.post("/api/v1/me/progress")
async def post_attempt(attempt: AttemptRequest) -> dict[str, Any]:
    # Server-side compute stars (зеркало task.js + ADR-005 design)
    errors = attempt.errors
    if errors == 0:
        stars = 5
    elif errors <= 2:
        stars = 4
    elif errors <= 5:
        stars = 3
    elif errors <= 10:
        stars = 2
    else:
        stars = 1

    key = str(attempt.lesson_num)
    prev = _state["progress"].get(key, {})
    new_prog = {
        "tier": attempt.tier,
        "lesson_num": attempt.lesson_num,
        "stars": max(stars, prev.get("stars", 0)),
        "best_wpm": min(1500, max(attempt.wpm, prev.get("best_wpm", 0))),
        "best_accuracy": max(attempt.accuracy, prev.get("best_accuracy", 0)),
        "best_time": min(attempt.duration_ms / 1000, prev.get("best_time", float("inf"))),
        "completed_at": attempt.completed_at or "2026-06-07T14:00:00Z",
    }
    _state["progress"][key] = new_prog
    _state["history"].append(
        {
            "lesson": attempt.lesson_num,
            "completedAt": new_prog["completed_at"],
            "duration": attempt.duration_ms / 1000,
            "wpm": attempt.wpm,
            "accuracy": attempt.accuracy,
        }
    )
    # Mock: всегда возвращаем 1 newly_earned для теста shape'а
    newly = [{"id": "wpm30", "label": "30 зн/мин", "earned_at": "2026-06-07T14:00:00Z"}] if attempt.wpm >= 30 else []
    return {
        "progress": new_prog,
        "newly_earned": newly,
        "next_unlocked": {"tier": attempt.tier, "lesson_num": attempt.lesson_num + 1},
    }


@app.get("/api/v1/me/history")
async def get_history(cursor: str | None = None, limit: int = 50) -> dict[str, Any]:
    all_items = _state["history"]
    start = int(cursor) if cursor else 0
    slice_items = all_items[start : start + limit]
    next_cursor = str(start + limit) if start + limit < len(all_items) else None
    return {"items": slice_items, "next_cursor": next_cursor, "total": len(all_items)}


@app.get("/api/v1/me/achievements")
async def get_achievements() -> list[dict[str, Any]]:
    return [
        {"id": "first_lesson", "label": "Первый урок", "earned_at": "2026-06-07T10:00:00Z"},
        {"id": "wpm30", "label": "30 зн/мин", "earned_at": "2026-06-07T11:00:00Z"},
    ]


@app.get("/api/v1/lessons/{tier}/{n}")
async def get_lesson(tier: str, n: int) -> dict[str, Any]:
    return {
        "id": f"{tier}_lesson_{n:02d}",
        "tier": tier,
        "lesson_number": n,
        "title": f"Mock Lesson {n}",
        "text": "ааа ооо",
        "target_wpm": 30,
        "error_limit": 2,
        "tips": [],
    }


@app.get("/api/v1/lessons/{tier}")
async def list_lessons(tier: str) -> list[dict[str, Any]]:
    return [{"tier": tier, "lesson_number": i, "title": f"Mock Lesson {i}"} for i in range(1, 100)]


@app.get("/api/v1/lessons/{tier}/{n}/access")
async def check_access(tier: str, n: int) -> dict[str, Any]:
    # Mock paywall: FREE_LESSON_LIMIT=5 из PRD Q1
    if n > 5:
        return {"allowed": False, "reason": "paywall"}
    return {"allowed": True, "reason": None}


@app.post("/api/v1/auth/signup")
async def signup(req: SignupRequest) -> dict[str, Any]:
    _state["profile"].update(req.model_dump(exclude_none=True))
    return {
        "user": _state["profile"],
        "access": "mock-access-token",
        "refresh": "mock-refresh-token",
    }


@app.post("/api/v1/auth/signin")
async def signin() -> dict[str, Any]:
    return {
        "user": _state["profile"],
        "access": "mock-access-token",
        "refresh": "mock-refresh-token",
    }


@app.post("/api/v1/auth/signout", status_code=204)
async def signout() -> None:
    return None


@app.post("/api/v1/auth/migrate-guest")
async def migrate_guest(payload: dict[str, Any]) -> dict[str, Any]:
    guest_data = payload.get("guest_data", {})
    if guest_data.get("profile"):
        _state["profile"].update(guest_data["profile"])
    if guest_data.get("lessonProgress"):
        for key, val in guest_data["lessonProgress"].items():
            _state["progress"][key] = {**val, "tier": "tier1", "lesson_num": int(key)}
    if guest_data.get("testHistory"):
        _state["history"].extend(guest_data["testHistory"])
    return {"user": _state["profile"], "migrated": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=9001, log_level="warning")
