import logging
import asyncio
from config import settings
from pydantic import BaseModel, FilePath, DirectoryPath

logger = logging.getLogger(__name__)


class YouTubeClient(BaseModel):
    #these become self. fields automatically
    name: str
    base_dir: DirectoryPath

    #defaults
    yt_prefix: str = "YT___"
    dl_format_filter: str = "bestaudio/best"
    dl_format: str = "wav"
    dl_quality: str = "0"
    dl_user_agent: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
    dl_temp_format: str = "%(ext)s"
    cmd_timeout: int = 120

    #binaries
    python_bin: FilePath = settings.PYTHON_BIN_PATH
    js_runtime_bin: FilePath = settings.JS_RUNTIME_BIN_PATH
    ffmpeg_dir: DirectoryPath = settings.BIN_DIR


    async def _run_command(self, cmd: list[str]) -> tuple[int, str, str]:
        """
        Runs a system command asynchronously
        Returns: (exit_code, stdout, stderr)
        """
        cmd_str = " ".join(cmd)
        logger.info(f"Executing command: {cmd_str}")

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            #wait for completion with a timeout
            try:
                stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=self.cmd_timeout)
            except asyncio.TimeoutError:
                process.kill()
                logger.error(f"Command timed out after {self.cmd_timeout}s: {cmd_str}")
                return (1, "", "TimeoutError")

            logger.info("Command success.")
            return (
                process.returncode or 0,
                stdout.decode(errors="replace").strip(),
                stderr.decode(errors="replace").strip()
            )
        
        except FileNotFoundError:
            logger.error(f"Executable not found in command: {cmd_str}")
            return (127, "", "FileNotFoundError")
        
        except Exception as e:
            logger.error(f"Unexpected error running command '{cmd_str}': {e}")
            return (1, "", str(e))
        

    async def update(self) -> bool:
        """
        Update yt-dlp using the specified python binary
        """
        cmd = [
            str(self.python_bin),
            "-m", "pip", "install",
            "--no-cache-dir",
            "-U", "--pre",
            "yt-dlp[default]"
        ]

        logger.info(f"Starting yt-dlp update...")

        try:
            code, out, err = await self._run_command(cmd)

            if code != 0:
                logger.error(f"yt-dlp update failed with code {code}: {err}")
                return False
            
            logger.info("yt-dlp updated successfully.")
            logger.debug(f"Pip output: {out}")
            return True

        except Exception as e:
            logger.error(f"Unexpected error during yt-dlp update: {e}")
            return False
        
