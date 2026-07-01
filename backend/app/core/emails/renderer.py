"""Рендеринг email-шаблонов (Jinja2, i18n RU+EN — ADR-005 §8).

Тело — `templates/<event>/<lang>.html`. Тема — из SUBJECTS (короткие строки
держим в коде, не в шаблоне). Неизвестный язык → fallback на ru.
"""

from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATES_DIR = Path(__file__).parent / "templates"
SUPPORTED_LANGS = ("ru", "en")
DEFAULT_LANG = "ru"

_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html"]),
    trim_blocks=True,
    lstrip_blocks=True,
)

# Темы писем: (event, lang) → subject. Fallback на ru при отсутствии.
SUBJECTS: dict[tuple[str, str], str] = {
    ("welcome", "ru"): "Добро пожаловать в Клавиатренажёр!",
    ("welcome", "en"): "Welcome to Typing Trainer!",
    ("verify_email", "ru"): "Подтвердите ваш email",
    ("verify_email", "en"): "Confirm your email",
    ("password_reset", "ru"): "Сброс пароля",
    ("password_reset", "en"): "Password reset",
}


def _norm_lang(language: str | None) -> str:
    return language if language in SUPPORTED_LANGS else DEFAULT_LANG


def render_email(event: str, language: str | None, **ctx: object) -> tuple[str, str]:
    """Вернуть (subject, html) для события и языка.

    Raises:
        jinja2.TemplateNotFound: если шаблон события отсутствует.
    """
    lang = _norm_lang(language)
    subject = SUBJECTS.get((event, lang)) or SUBJECTS[(event, DEFAULT_LANG)]
    template = _env.get_template(f"{event}/{lang}.html")
    return subject, template.render(**ctx)
