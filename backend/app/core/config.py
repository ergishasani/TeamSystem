from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8081"

    # AI concierge engine priority: Google ADK (Gemini) → OpenAI → rule-based.
    # Each is optional; with no keys set the app uses the rule-based engine, so
    # it always works with no key and no cost.
    #
    # Google ADK / Gemini (preferred). Get a key from https://aistudio.google.com.
    GOOGLE_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.0-flash"
    # OpenAI (legacy fallback engine).
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",")]

    model_config = {"env_file": ".env"}


settings = Settings()
