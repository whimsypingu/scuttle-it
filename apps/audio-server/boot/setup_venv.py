import os
import json
import venv
import logging
import subprocess

from pathlib import Path

from .boot_utils import get_workspace_path, update_env
from .boot_exceptions import SetupError, WorkspaceConfigError, VenvInitializationError

logger = logging.getLogger(__name__)


def get_python_bin(venv_path: str = None) -> Path:
    """
    Given a venv path, returns a path to the python binary (regardless of if it exists or not).
    """
    if not venv_path:
        venv_path = get_workspace_path("apps.audio-server.venv")

    bin_name = "python.exe" if os.name == "nt" else "python"
    scripts_dir = "Scripts" if os.name == "nt" else "bin"
    python_bin = venv_path / scripts_dir / bin_name

    return python_bin


def ensure_venv():
    """
    Checks workspace.json for where to find a venv folder, and then creates it if it doesn't exist yet
    Returns python binary inside the venv
    """
    try:
        #extract venv path            
        abs_venv_path = get_workspace_path("apps.audio-server.venv")

        #check for binary
        python_bin = get_python_bin(abs_venv_path)

        #create venv if missing
        if not python_bin.exists():
            logger.info(f"venv missing or broken (no executable). Initializing at: {abs_venv_path}")
            venv.create(env_dir=abs_venv_path, with_pip=True, clear=True) #theoretically could throw PermissionError if not enough installation space

            logger.info("venv creation successful.")
        else:
            logger.info(f"Verified healthy venv exists at {abs_venv_path}")

        update_env("PYTHON_BIN_PATH", python_bin)
        return python_bin

    except json.JSONDecodeError:
        raise SetupError("Invalid JSON format for workspace.json")

    except PermissionError:
        raise VenvInitializationError("Permission denied, venv may be in use")

    except (WorkspaceConfigError, VenvInitializationError):
        raise

    except Exception as e:
        logger.error(f"An unhandled error occurred during venv setup: {e}")
        raise VenvInitializationError(f"Could not create venv: {e}") from e


def run_pip_install(python_bin: Path = None, toml_path: Path = None, upgrade_pip: bool = True):
    """
    Executes pip commands within the specified venv bin directory.
    Expects python_bin field to be the python binary in the venv
    """
    if not python_bin:
        python_bin = get_python_bin()

    if not python_bin.exists():
        raise FileNotFoundError(f"Could not find python executable at {python_bin}")
    
    #upgrade pip itself first, standard practice apparently
    if upgrade_pip:
        logger.info("Upgrading pip...")
        subprocess.run(
            [str(python_bin), "-m", "pip", "install", "--upgrade", "pip", "setuptools", "wheel"], 
            check=True,
            capture_output=True,
            text=True
        )

    if not toml_path:
        toml_path = get_workspace_path("apps.audio-server.toml")

    #install editable
    if toml_path and toml_path.exists():
        logger.info(f"Performing editable install from {toml_path}...")
        subprocess.run(
            [str(python_bin), "-m", "pip", "install", "-e", str(toml_path.parent)], 
            check=True,
            capture_output=True,
            text=True
        )
    elif toml_path:
        logger.warning(f"pyproject.toml file not found at {toml_path}, skipping.")


def install_ytdlp(python_bin: Path = None):
    """
    Standalone specialized install for yt-dlp to get the latest pre-releases.
    """
    if not python_bin:
        python_bin = get_python_bin()

    if not python_bin.exists():
        raise FileNotFoundError(f"Could not find python executable at {python_bin}")
    
    logger.info("Installing/Updating yt-dlp (pre-release)...")
    
    # -U is --upgrade, --pre allows development/pre-release versions
    subprocess.run(
        [str(python_bin), "-m", "pip", "install", "--no-cache-dir", "-U", "--pre", "yt-dlp[default]"], 
        check=True,
        capture_output=True,
        text=True
    )
