import os
import sys
import shutil
import tempfile
import zipfile
import urllib.request
import logging 
from pathlib import Path

from .boot_utils import get_workspace_path, check_binary_exists, update_env
from .boot_exceptions import FFmpegInstallError

logger = logging.getLogger(__name__)


# FFMPEG_URLS = {
#     ("Windows", "AMD64"): "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip",
#     ("Linux", "x86_64"): "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz",
#     ("Darwin", "arm64"): "https://evermeet.cx/ffmpeg/ffmpeg-6.0.zip",
# }

FFMPEG_BIN_NAME = "ffmpeg.exe" if os.name == "nt" else "ffmpeg"
FFPROBE_BIN_NAME = "ffprobe.exe" if os.name == "nt" else "ffprobe"

BIN_DIR = "BIN_DIR"
FFMPEG_BIN_PATH = "FFMPEG_BIN_PATH"
FFPROBE_BIN_PATH = "FFPROBE_BIN_PATH"

#rip emojis
def install_ffmpeg_windows():
    url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"

    try:
        bin_dir = get_workspace_path(query="apps.audio-server.bin", ensure_exists=True)

        with tempfile.TemporaryDirectory() as tmp:
            archive_path = Path(tmp) / "ffmpeg.zip"
            logger.info(f"Downloading ffmpeg from {url} ...")

            with urllib.request.urlopen(url) as response, open(archive_path, 'wb') as out_file: 
                shutil.copyfileobj(response, out_file)

            #extract zip
            logger.info("Extracting archive ...")
            extract_dir = Path(tmp) / "extracted"
            with zipfile.ZipFile(archive_path, "r") as zf:
                zf.extractall(extract_dir)

            #find ffmpeg and ffprobe and move it into venv
            for root, _, files in os.walk(extract_dir):
                for name in files:
                    if name.lower() in (FFMPEG_BIN_NAME, FFPROBE_BIN_NAME):
                        src = Path(root) / name
                        dest = bin_dir / name
                        shutil.copy2(src, dest)

                        logger.info(f"Installed {dest.name} to {bin_dir}")

        logger.info("ffmpeg and ffprobe installed successfully.")

        update_env(BIN_DIR, bin_dir)
        update_env(FFMPEG_BIN_PATH, bin_dir / FFMPEG_BIN_NAME)
        update_env(FFPROBE_BIN_PATH, bin_dir / FFPROBE_BIN_NAME)

        logger.info(f"Saved FFmpeg binaries and related paths to {bin_dir} in .env file")
        return
    
    except Exception as e:
        raise FFmpegInstallError(f"Failed to download or extract ffmpeg: {e}") from e


def install_ffmpeg_macos():
    url = "https://evermeet.cx/ffmpeg/getrelease/zip"

    try:
        bin_dir = get_workspace_path(query="apps.audio-server.bin", ensure_exists=True)

        with tempfile.TemporaryDirectory() as tmp:
            archive_path = Path(tmp) / "ffmpeg.zip"
            logger.info(f"Downloading ffmpeg from {url} ...")

            with urllib.request.urlopen(url) as response, open(archive_path, 'wb') as out_file:
                shutil.copyfileobj(response, out_file)

            #extract zip
            logger.info("Extracting archive ...")
            extract_dir = Path(tmp) / "extracted"
            shutil.unpack_archive(archive_path, extract_dir)

            # Move ffmpeg + ffprobe to venv/bin
            for name in (FFMPEG_BIN_NAME, FFPROBE_BIN_NAME):
                src = next(extract_dir.rglob(name), None)
                if src and src.is_file():
                    dest = bin_dir / name
                    shutil.copy2(src, dest)
                    os.chmod(dest, 0o755)

                    logger.info(f"Installed {dest.name} to {bin_dir}")

        logger.info("ffmpeg and ffprobe installed successfully.")

        update_env(BIN_DIR, bin_dir)
        update_env(FFMPEG_BIN_PATH, bin_dir / FFMPEG_BIN_NAME)
        update_env(FFPROBE_BIN_PATH, bin_dir / FFPROBE_BIN_NAME)

        logger.info(f"Saved FFmpeg binaries and related paths to {bin_dir} in .env file")
        return

    except Exception as e:
        raise FFmpegInstallError(f"Failed to download or extract ffmpeg: {e}") from e


def install_ffmpeg_linux():
    url = "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"

    try:
        bin_dir = get_workspace_path(query="apps.audio-server.bin", ensure_exists=True)

        with tempfile.TemporaryDirectory() as tmp:
            archive_path = Path(tmp) / "ffmpeg.tar.xz"
            logger.info(f"Downloading ffmpeg from {url} ...")

            with urllib.request.urlopen(url) as response, open(archive_path, "wb") as out_file:
                shutil.copyfileobj(response, out_file)

            #extract zip
            logger.info("Extracting archive ...")
            extract_dir = Path(tmp) / "extracted"
            shutil.unpack_archive(archive_path, extract_dir)

            # find ffmpeg and ffprobe in extracted folder
            for name in (FFMPEG_BIN_NAME, FFPROBE_BIN_NAME):
                src = next(extract_dir.rglob(name), None)
                if src and src.is_file():
                    dest = bin_dir / name
                    shutil.copy2(src, dest)
                    os.chmod(dest, 0o755)

                    logger.info(f"Installed {dest.name} to {bin_dir}")

        logger.info("ffmpeg and ffprobe installed successfully.")

        update_env(BIN_DIR, bin_dir)
        update_env(FFMPEG_BIN_PATH, bin_dir / FFMPEG_BIN_NAME)
        update_env(FFPROBE_BIN_PATH, bin_dir / FFPROBE_BIN_NAME)

        logger.info(f"Saved FFmpeg binaries and related paths to {bin_dir} in .env file")
        return
    
    except Exception as e:
        raise FFmpegInstallError(f"Failed to download or extract ffmpeg: {e}") from e


def download_ffmpeg(force: bool = False):
    """
    Downloads and extracts the latest ffmpeg and ffprobe binaries for the current platform.

    Args:
        force (bool): Whether to force download from source. Defaults to False

    Raises:
        FFmpegInstallError: If the download, extraction, or permission update fails.    
    """
    #initial check to just re-register in env if binaries already exist
    if not force:
        bin_dir = get_workspace_path(query="apps.audio-server.bin", ensure_exists=True)
        ffmpeg_path = check_binary_exists("ffmpeg")
        ffprobe_path = check_binary_exists("ffprobe")

        if ffmpeg_path and ffprobe_path:
            logger.info(f"ffmpeg and ffprobe binaries already exists at {bin_dir}.")

            update_env(BIN_DIR, bin_dir)
            update_env(FFMPEG_BIN_PATH, bin_dir / FFMPEG_BIN_NAME)
            update_env(FFPROBE_BIN_PATH, bin_dir / FFPROBE_BIN_NAME)

            logger.info(f"Saved FFmpeg binaries and related paths to {bin_dir} in .env file")
            return

    #os
    system = sys.platform
    if system.startswith("win"):
        return install_ffmpeg_windows()
    elif system == "darwin":
        return install_ffmpeg_macos()
    elif system.startswith("linux"):
        return install_ffmpeg_linux()
        
    #no installation, return nothing
    else:
        raise FFmpegInstallError(f"FFmpeg auto-install is not supported on: {system}")
