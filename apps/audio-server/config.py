from pathlib import Path
from pydantic import DirectoryPath, FilePath
from pydantic_settings import BaseSettings, SettingsConfigDict

# calculate the project root relative to this file (must be in /apps/audio-server/config.py) to find the .env file
_CURRENT_DIR = Path(__file__).resolve().parent
_ROOT_DIR = _CURRENT_DIR.parent.parent
ENV_FILE = _ROOT_DIR / ".env"

class Settings(BaseSettings):
    # --- SERVER CONFIG ---
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    # --- ENV PATH VALIDATION ---
    BIN_DIR: DirectoryPath #validates that this directory actually exists
    DATA_DIR: DirectoryPath 
    DATABASE_DIR: DirectoryPath
    
    PYTHON_BIN_PATH: FilePath #consider adding binary executable checks
    JS_RUNTIME_BIN_PATH: FilePath
    FFMPEG_BIN_PATH: FilePath
    FFPROBE_BIN_PATH: FilePath

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()