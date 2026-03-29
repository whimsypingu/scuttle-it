import os
import sys
import stat
import platform
import json
import urllib.request
import logging 

from .boot_utils import get_workspace_path, check_binary_exists, update_env
from .boot_exceptions import CloudflaredInstallError

logger = logging.getLogger(__name__)


def _get_cloudflared_name() -> dict:
    """
    Identifies the correct Cloudflared binary asset for the current OS/Arch.

    Returns:
        dict: A dictionary containing 'asset_name' and 'url' for the latest GitHub release.
    """
    system = sys.platform
    machine = platform.machine().lower()

    #platform/arch to release name, may require updating
    if system.startswith("win"):
        asset_name = "cloudflared-windows-amd64.exe"
    elif system == "darwin":
        # Apple silicon vs intel
        if machine in ("arm64", "aarch64"):
            asset_name = "cloudflared-darwin-arm64"
        else:
            asset_name = "cloudflared-darwin-amd64"
    elif system.startswith("linux"):
        if machine in ("aarch64", "arm64"):
            asset_name = "cloudflared-linux-arm64"
        else:
            asset_name = "cloudflared-linux-amd64"
    else:
        raise CloudflaredInstallError(f"Unsupported platform: {system}/{machine}")

    #https://github.com/cloudflare/cloudflared/releases/download/2025.9.1/cloudflared-windows-amd64.exe
    #https://github.com/cloudflare/cloudflared/releases/download/2025.9.1/cloudflared-linux-amd64
    #gets the download link for the latest release version
    url = "https://api.github.com/repos/cloudflare/cloudflared/releases/latest"
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            release_data = json.load(response)
    except Exception as e:
        raise CloudflaredInstallError(f"Failed to fetch cloudflared release info: {e}") from e

    download_url = None
    for asset in release_data.get("assets", []):
        if asset.get("name") == asset_name:
            download_url = asset.get("browser_download_url")
            break

    if not download_url:
        raise CloudflaredInstallError(f"Could not find cloudflared asset for {asset_name}")
        
    return {
        "asset_name": asset_name,
        "url": download_url
    }


def download_cloudflared(target_path=None, force: bool = False):
    """
    Downloads and extracts the latest Cloudflared binary for the current platform.
    This uses Cloudflare's GitHub releases pattern
    https://github.com/cloudflare/cloudflared/releases

    The function resolves the appropriate release from GitHub, downloads the 
    zip archive into memory, and extracts the binary to the specified location.
    On Unix-like systems, it automatically sets the owner-execute bit.

    Args:
        target_path (Path, optional): The destination path for the Cloudflared binary. 
            Defaults to the path defined in 'apps.audio_server.bin' in the manifest.
        force (bool): Whether to force download from source. Defaults to False

    Raises:
        CloudflaredInstallError: If the download, extraction, or permission update fails.    
    """
    TUNNEL_BIN_PATH = "TUNNEL_BIN_PATH"

    #initial check to just re-register in env if binary already exists
    if not force:
        target_path = check_binary_exists("cloudflared")

        if target_path:
            logger.info(f"cloudflared binary already exists at {target_path}.")

            update_env(TUNNEL_BIN_PATH, target_path)
            logger.info(f"Saved cloudflared binary path to {TUNNEL_BIN_PATH} in .env file")
            return

    cf_metadata = _get_cloudflared_name()
    asset_name = cf_metadata["asset_name"]
    url = cf_metadata["url"]
    bin_name = "cloudflared.exe" if os.name == "nt" else "cloudflared" #hard-coded executable here hopefully it stays this way

    #download
    logger.info(f"Downloading cloudflared from {url}...")

    #prepare directory and download in chunks to a temp file before swapping
    if target_path is None:
        target_path = get_workspace_path(query="apps.audio-server.bin", ensure_exists=True) / bin_name

    temp_path = target_path.with_suffix(target_path.suffix + ".part") if target_path.suffix else target_path.with_suffix(".part")
    try:
        with urllib.request.urlopen(url, timeout=60) as response, open(temp_path, "wb") as out_file:
            CHUNK_SIZE = 8192
            while True:
                chunk = response.read(CHUNK_SIZE)
                if not chunk:
                    break
                out_file.write(chunk)

        #atomic replace (works on same filesystem)
        temp_path.replace(target_path)

        #set execute bit for unix-like systems
        if os.name != "nt":
            mode = target_path.stat().st_mode
            target_path.chmod(mode | stat.S_IXUSR) #adds execute ability for user
            logger.info(f"Fixed Unix permissions for: {target_path}")

        logger.info(f"Saved cloudflared binary to {target_path}")

        update_env(TUNNEL_BIN_PATH, target_path)
        logger.info(f"Saved cloudflared binary path to {TUNNEL_BIN_PATH} in .env file")
        return

    except Exception as e:
        #cleanup partial file if anything went wrong
        try:
            if temp_path.exists():
                temp_path.unlink()
        except Exception:
            pass
        raise CloudflaredInstallError(f"Failed to download or extract cloudflared: {e}") from e
