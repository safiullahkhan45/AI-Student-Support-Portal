from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ANTHROPIC_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-sonnet-4-20250514"
    CHROMA_PERSIST_PATH: str = "./chroma_db"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
