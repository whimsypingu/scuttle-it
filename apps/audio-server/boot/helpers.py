import json
import logging
from pathlib import Path
from .errors import WorkspaceConfigError

logger = logging.getLogger(__name__)

def get_repo_root(max_depth: int = 5) -> Path:
    """
    Climbs up directories to find workspace.json within a safety depth limit.
    """
    current = Path(__file__).resolve().parent
    
    for i in range(max_depth):
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

def get_workspace_item(query: str, default=None):
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