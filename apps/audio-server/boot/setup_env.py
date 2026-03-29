import logging

from .helpers import update_env, get_workspace_path

logger = logging.getLogger(__name__)


def set_env_defaults(overwrite: bool = True):
    """
    Sets the .env file at the root with some hard-coded default values.
    
    Args:
        overwrite (bool): Force an overwrite if already set to something.
    """

    defaults = {
        "HOST": "0.0.0.0",
        "PORT": 8000,
        "DEBUG": False,
        "DATA_DIR": get_workspace_path("apps.audio-server.data", ensure_exists=True)
    }

    logger.info("Initializing .env default values")

    for key, val in defaults.items():
        update_env(key, val, overwrite=overwrite)