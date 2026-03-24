import os
import json
import logging
from pathlib import Path
from .errors import WorkspaceConfigError

logger = logging.getLogger(__name__)


# --- WORKSPACE FILE ---
def get_repo_root(max_depth: int = 5) -> Path:
    """
    Climbs up directories to find workspace.json within a safety depth limit.
    """
    current = Path(__file__).resolve().parent
    
    for _ in range(max_depth):
        if (current / "workspace.json").exists():
            return current
        if current.parent == current:
            break
        current = current.parent

    raise WorkspaceConfigError(f"Workspace root not found within {max_depth} levels.")

def get_workspace() -> dict:
    """
    Locates and parses the workspace.json file.
    """
    root = get_repo_root()
    workspace_path = root / "workspace.json"

    try:
        with open(workspace_path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        raise WorkspaceConfigError(f"workspace missing at {workspace_path}") from None
    except json.JSONDecodeError as e:
        raise WorkspaceConfigError(f"Malformed JSON in workspace.json: {e}") from None

def get_workspace_item(query: str, default: str = None) -> str:
    """
    Finds any field in workspace.json using a dotted path (e.g., "apps.audio-server.venv"), replacing - with _ internally.
    
    Returns the value (str, dict, list, etc.) or the default if provided.
    """
    config = get_workspace()
    keys = [k.replace("-", "_") for k in query.split(".")] #for ease of use, support - as well as _

    val = config
    try:
        for key in keys:
            val = val[key]
        return val
    except (KeyError, TypeError):
        if default is not None:
            return default
        logger.error(f"Required workspace item '{query}' not found.")
        raise WorkspaceConfigError(f"Missing required configuration key: {query}") from None

def get_workspace_path(query: str, default: str = None) -> Path:
    """
    Specialized helper for fields that represent relative paths.
    
    Returns an absolute Path object resolved against the repo root.

    Example: get_workspace_path("apps.audio-server.venv")
    """
    rel_path = get_workspace_item(query, default=default)
    if not isinstance(rel_path, str):
        raise WorkspaceConfigError(f"workspace item '{query}' must be a string path, got {type(rel_path)}")
        
    return (get_repo_root() / rel_path).resolve()


# --- ENV FILE ---
def check_binary_exists(bin_name: str, folder_path: Path = None) -> Path | None:
    """
    Checks if a specific binary exists in the given folder and is executable.

    Args: 
        bin_name (str): Binary filename
        folder_path (Path | None): Folder to search for the binary. Defaults to /apps/audio-server/bin/
        
    Returns a Path to the binary if it exists, or None
    """
    if os.name == "nt" and not bin_name.endswith(".exe"):
        bin_name += ".exe"

    if not folder_path:
        folder_path = get_workspace_path("apps.audio-server.bin")

    bin_path = folder_path / bin_name

    #binary existence
    if not bin_path.exists():
        logger.warning(f"Binary {bin_name} not found at {folder_path}")
        return None
        
    #permission check
    if not os.access(bin_path, os.X_OK):
        logger.critical(f"Binary {bin_name} found at {folder_path}, but not executable.")
        return None
    
    return bin_path


def update_env(key: str, value: str | Path):
    """
    Update or insert a key=value pair in the .env file. 
    DOES NOT call load_dotenv(override=True) afterwards.
    Creates .env file if doesn't exist at the overall project root

    Args:
        key (str): Environment variable name.
        value (str | Path): New value to set. Converts Paths to posix str
    """
    val_str = value.as_posix() if isinstance(value, Path) else str(value)
    new_line = f"{key}={val_str}\n"

    env_file = get_repo_root() / ".env"

    # Read existing lines if the file exists
    lines = []
    if env_file.exists():
        with env_file.open("r") as f:
            lines = f.readlines()

    # Update if key exists, else append
    updated = False
    for i, line in enumerate(lines):
        if line.strip().startswith(f"{key}="):
            lines[i] = new_line
            updated = True
            break

    if not updated:
        lines.append(new_line)

    # Write all lines back to the .env file
    with env_file.open("w") as f:
        f.writelines(lines)

    os.environ[key] = str(value) #just in case Path
    logger.info(f"Environment variable {key} set to {value}")

