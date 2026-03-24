import os
import json
import venv
import logging
import subprocess

from pathlib import Path

from .helpers import get_workspace_path
from .errors import SetupError, WorkspaceConfigError, VenvInitializationError

logger = logging.getLogger(__name__)


def get_python_exe(venv_path: str = None) -> Path:
    """
    Given a venv path, returns a path to the python binary (regardless of if it exists or not).
    """
    if not venv_path:
        venv_path = get_workspace_path("apps.audio-server.venv")

    bin_name = "python.exe" if os.name == "nt" else "python"
    scripts_dir = "Scripts" if os.name == "nt" else "bin"
    python_exe = venv_path / scripts_dir / bin_name

    return python_exe


def ensure_venv():
    """
    Checks workspace.json for where to find a venv folder, and then creates it if it doesn't exist yet
    Returns python binary inside the venv
    """
    try:
        #extract venv path            
        abs_venv_path = get_workspace_path("apps.audio-server.venv")

        #check for binary
        python_exe = get_python_exe(abs_venv_path)

        #create venv if missing
        if not python_exe.exists():
            logger.info(f"venv missing or broken (no executable). Initializing at: {abs_venv_path}")
            venv.create(env_dir=abs_venv_path, with_pip=True, clear=True) #theoretically could throw PermissionError if not enough installation space

            logger.info("venv creation successful.")
        else:
            logger.info(f"Verified healthy venv exists at {abs_venv_path}")

        return python_exe

    except json.JSONDecodeError:
        raise SetupError("Invalid JSON format for workspace.json")

    except PermissionError:
        raise VenvInitializationError("Permission denied, venv may be in use")

    except (WorkspaceConfigError, VenvInitializationError):
        raise

    except Exception as e:
        logger.error(f"An unhandled error occurred during venv setup: {e}")
        raise VenvInitializationError(f"Could not create venv: {e}") from e


def run_pip_install(python_exe: Path = None, requirements_path: Path = None, upgrade_pip: bool = True):
    """
    Executes pip commands within the specified venv bin directory.
    Expects python_exe field to be the python binary in the venv
    """
    if not python_exe:
        python_exe = get_python_exe()

    if not python_exe.exists():
        raise FileNotFoundError(f"Could not find python executable at {python_exe}")
    
    #upgrade pip itself first, standard practice apparently
    if upgrade_pip:
        logger.info("Upgrading pip...")
        subprocess.run(
            [str(python_exe), "-m", "pip", "install", "--upgrade", "pip"], 
            check=True,
            capture_output=True,
            text=True
        )

    if not requirements_path:
        requirements_path = get_workspace_path("apps.audio-server.requirements")

    #install from requirements.txt
    if requirements_path and requirements_path.exists():
        logger.info(f"Installing requirements from {requirements_path}...")
        subprocess.run(
            [str(python_exe), "-m", "pip", "install", "--upgrade", "-r", str(requirements_path)], 
            check=True,
            capture_output=True,
            text=True
        )
    elif requirements_path:
        logger.warning(f"Requirements file not found at {requirements_path}, skipping.")


def install_ytdlp(python_exe: Path = None):
    """
    Standalone specialized install for yt-dlp to get the latest pre-releases.
    """
    if not python_exe:
        python_exe = get_python_exe()

    if not python_exe.exists():
        raise FileNotFoundError(f"Could not find python executable at {python_exe}")
    
    logger.info("Installing/Updating yt-dlp (pre-release)...")
    
    # -U is --upgrade, --pre allows development/pre-release versions
    subprocess.run(
        [str(python_exe), "-m", "pip", "install", "-U", "--pre", "yt-dlp[default]"], 
        check=True,
        capture_output=True,
        text=True
    )
