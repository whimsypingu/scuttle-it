import logging
import sys
from boot.errors import SetupError
from boot.setup_venv import ensure_venv, run_pip_install, install_ytdlp
from boot.install_deno import download_deno

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s [%(name)s]: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

logger.info("Audio Server setup initialized")

try:
    python_exe = ensure_venv()
    run_pip_install()
    install_ytdlp()

    download_deno(force=False)
    
except SetupError as e:
    print(f"\033[91m[SETUP ERROR]\033[0m {e}")
    logger.exception("A critical error occurred during the setup process.")
    sys.exit(1)