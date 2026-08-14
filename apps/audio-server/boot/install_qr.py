import os
import shutil
import stat
import sys
import platform
import urllib.request
import json
import logging 
from pathlib import Path

from .boot_utils import get_workspace_path, check_binary_exists, update_env
from .boot_exceptions import QrInstallError

logger = logging.getLogger(__name__)


def _get_qr_name() -> dict:
    """
    Identifies the correct QR code generation binary asset for the current OS/Arch.

    Returns:
        dict: A dictionary containing 'asset_name' and 'url' for the latest GitHub release.
    """
    system = sys.platform
    machine = platform.machine().lower()

    #platform/arch to release name, may require updating
    if machine in ("arm64", "aarch64"):
        arch = "arm64"
    else:
        arch = "x86_64"

    #os
    asset_name = None
    if system.startswith("win"):
        asset_name = "qr-windows-x86_64.exe"
    elif system == "darwin":
        asset_name = "qr-macos-universal"
    elif system.startswith("linux"):
        asset_name = f"qr-linux-{arch}"
    else:
        raise QrInstallError(f"Unsupported platform: {system}/{machine}")

    #gets the download link for the latest release version
    #url = "https://api.github.com/repos/cloudflare/cloudflared/releases/latest"
    url = "https://api.github.com/repos/whimsypingu/qr-codes/releases/latest"
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            release_data = json.load(response)
    except Exception as e:
        raise QrInstallError(f"Failed to fetch QR codes release info: {e}") from e

    download_url = None
    for asset in release_data.get("assets", []):
        if asset.get("name") == asset_name:
            download_url = asset.get("browser_download_url")
            break

    if not download_url:
        raise QrInstallError(f"Could not find QR codes asset for {asset_name}")
        
    return {
        "asset_name": asset_name,
        "url": download_url
    }


def download_qr(target_path: Path = None, force: bool = False):
    """
    Downloads and extracts the latest QR binary for the current platform.
    Simpler asset structure produces just the binary so no unzipping necessary.

    Args:
        target_path (Path, optional): The destination path for the QR binary. 
            Defaults to the path defined in 'apps.audio_server.bin' in the manifest.
        force (bool): Whether to force download from source. Defaults to False

    Raises:
        QrInstallError: If the download, extraction, or permission update fails.    
    """
    QR_GEN_BIN_PATH = "QR_GEN_BIN_PATH"

    #initial check to just re-register in env if binary already exists
    if not force:
        target_path = check_binary_exists("qr")

        if target_path:
            logger.info(f"qr binary already exists at {target_path}.")

            update_env(QR_GEN_BIN_PATH, target_path)
            logger.info(f"Saved qr binary path to {QR_GEN_BIN_PATH} in .env file")
            return

    cf_metadata = _get_qr_name()
    asset_name = cf_metadata["asset_name"]
    url = cf_metadata["url"]
    bin_name = "qr.exe" if os.name == "nt" else "qr" #hard-coded executable here hopefully it stays this way

    #download
    logger.info(f"Downloading QR code generator from {url}...")

    #prepare directory and download in chunks to a temp file before swapping
    if target_path is None:
        target_path = get_workspace_path(query="apps.audio-server.bin", ensure_exists=True) / bin_name

    #do an in-memory download and extraction because deno packages in zip files
    try:
        with urllib.request.urlopen(url, timeout=60) as response, open(target_path, "wb") as out_file:
            shutil.copyfileobj(response, out_file)

        #set execute bit for unix-like systems
        if os.name != "nt":
            mode = target_path.stat().st_mode
            target_path.chmod(mode | stat.S_IXUSR) #adds execute ability for user
            logger.info(f"Fixed Unix permissions for: {target_path}")

        logger.info(f"Saved qr binary to {target_path}")

        update_env(QR_GEN_BIN_PATH, target_path)
        logger.info(f"Saved qr binary path to {QR_GEN_BIN_PATH} in .env file")
        return
    
    except Exception as e:
        raise QrInstallError(f"Failed to download or extract qr: {e}") from e

