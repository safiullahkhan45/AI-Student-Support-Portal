from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    AI_API_KEY: str = ""
    AI_MODEL: str = "llama-3.3-70b-versatile"
    CHROMA_PERSIST_PATH: str = "./chroma_db"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
