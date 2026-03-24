import os
import stat
import sys
import platform
import urllib.request
import json
import io
import zipfile
import logging 
from pathlib import Path

from .helpers import get_workspace_path, check_binary_exists, update_env
from .errors import DenoInstallError

logger = logging.getLogger(__name__)


def _get_deno_name() -> dict:
    """
    Identifies the correct Deno binary asset for the current OS/Arch.

    Returns:
        dict: A dictionary containing 'asset_name' and 'url' for the latest GitHub release.
    """
    system = sys.platform
    machine = platform.machine().lower()

    #platform/arch to release name, may require updating
    if machine in ("arm64", "aarch64"):
        arch = "aarch64"
    else:
        arch = "x86_64"

    #os
    if system.startswith("win"):
        os_part = "pc-windows-msvc"
    elif system == "darwin":
        os_part = "apple-darwin"
    elif system.startswith("linux"):
        os_part = "unknown-linux-gnu"
    else:
        raise DenoInstallError(f"Unsupported platform: {system}/{machine}")
    
    asset_name = f"deno-{arch}-{os_part}.zip"

    #gets the download link for the latest release version
    #url = "https://api.github.com/repos/cloudflare/cloudflared/releases/latest"
    url = "https://api.github.com/repos/denoland/deno/releases/latest"
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            release_data = json.load(response)
    except Exception as e:
        raise DenoInstallError(f"Failed to fetch deno release info: {e}") from e

    download_url = None
    for asset in release_data.get("assets", []):
        if asset.get("name") == asset_name:
            download_url = asset.get("browser_download_url")
            break

    if not download_url:
        raise DenoInstallError(f"Could not find deno asset for {asset_name}")
        
    return {
        "asset_name": asset_name,
        "url": download_url
    }


def download_deno(target_path: Path = None, force: bool = False) -> dict:
    """
    Downloads and extracts the latest Deno binary for the current platform.
    This uses Deno's GitHub releases pattern
    https://github.com/cloudflare/cloudflared/releases

    The function resolves the appropriate release from GitHub, downloads the 
    zip archive into memory, and extracts the binary to the specified location.
    On Unix-like systems, it automatically sets the owner-execute bit.

    Args:
        target_path (Path, optional): The destination path for the Deno binary. 
            Defaults to the path defined in 'apps.audio_server.bin' in the manifest.
        force (bool): Whether to force download from source. Defaults to False

    Returns:
        dict: A mapping containing 'JS_RUNTIME_BIN_PATH' pointing to the installed binary.

    Raises:
        DenoInstallError: If the download, extraction, or permission update fails.    
    """
    JS_RUNTIME_BIN_PATH = "JS_RUNTIME_BIN_PATH"

    #initial check to just re-register in env if binary already exists
    if not force:
        target_path = check_binary_exists("deno")

        if target_path:
            logger.info(f"deno binary already exists at {target_path}.")

            update_env(JS_RUNTIME_BIN_PATH, target_path)
            logger.info(f"Saved deno binary path to {JS_RUNTIME_BIN_PATH} in .env file")
            return

    cf_metadata = _get_deno_name()
    asset_name = cf_metadata["asset_name"]
    url = cf_metadata["url"]
    bin_name = "deno.exe" if os.name == "nt" else "deno" #hard-coded executable here hopefully it stays this way

    #download
    logger.info(f"Downloading deno from {url}...")

    #prepare directory and download in chunks to a temp file before swapping
    if target_path is None:
        target_path = get_workspace_path("apps.audio-server.bin") / bin_name

    #do an in-memory download and extraction because deno packages in zip files
    try:
        with urllib.request.urlopen(url, timeout=60) as response:
            zip_content = response.read()

        logger.info(f"Extracting {bin_name}...")

        with zipfile.ZipFile(io.BytesIO(zip_content)) as z:
            if bin_name in z.namelist():
                with z.open(bin_name) as source, open(target_path, "wb") as target:
                    target.write(source.read())
            
            else:
                # Fallback in case they change the zip structure
                found = False
                for file in z.namelist():
                    if file.endswith(bin_name):
                        with z.open(file) as source, open(target_path, "wb") as target:
                            target.write(source.read())
                        found = True
                        break
                if not found:
                    raise FileNotFoundError(f"Could not find {bin_name} inside the zip")

        #set execute bit for unix-like systems
        if os.name != "nt":
            mode = target_path.stat().st_mode
            target_path.chmod(mode | stat.S_IXUSR) #adds execute ability for user
            logger.info(f"Fixed Unix permissions for: {target_path}")

        logger.info(f"Saved deno binary to {target_path}")

        update_env(JS_RUNTIME_BIN_PATH, target_path)
        logger.info(f"Saved deno binary path to {JS_RUNTIME_BIN_PATH} in .env file")
        return
    
    except Exception as e:
        raise DenoInstallError(f"Failed to download or extract deno: {e}") from e

