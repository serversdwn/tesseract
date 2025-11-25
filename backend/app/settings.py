from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Database Configuration
    database_url: str = "sqlite:///./tesseract.db"

    # API Configuration
    api_title: str = "Tesseract - Nested Todo Tree API"
    api_description: str = "API for managing deeply nested todo trees"
    api_version: str = "1.0.0"

    # CORS Configuration
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]


# Global settings instance
settings = Settings()
