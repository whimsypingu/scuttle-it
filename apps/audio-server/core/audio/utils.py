from pathlib import Path

from config import settings


def resolve_track_path(track_id: str) -> Path:
    """Finds the first file matching track_id.* in the data directory."""
    for ext in [".flac", ".m4a", ".mp3"]: #EMERGENCY: remove this hardcoded value
        file_path = settings.DATA_DIR / f"{track_id}{ext}"
        if file_path.exists():
            return file_path
        
    raise FileNotFoundError(f"Track {track_id} not found")


def delete_track_file(track_id: str):
    try:
        track_path = resolve_track_path(track_id)
        track_path.unlink()
    except FileNotFoundError:
        raise
    except Exception as e:
        raise
