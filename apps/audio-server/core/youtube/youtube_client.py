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
            logger.exception(f"Unexpected error running command '{cmd_str}': {e}")
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
        

    async def download_by_youtube_id(
        self,
        youtube_id: str
    ) -> bool:
        """
        Downloads a specific YouTube video as an audio file and returns a Track object.

        This method orchestrates the full download pipeline: fetching audio via yt-dlp,
        parsing metadata from the stream, applying post-processing (silence trimming, 
        loudness normalization, compression), and calculating the final duration.

        Args:
            id (str): The YouTube video ID (e.g., "dQw4w9WgXcQ") or a prefixed ID.
            timeout (int): Maximum seconds allowed for the yt-dlp subprocess to run. 
                Defaults to 60.
            custom_metadata (Optional[dict]): A dictionary of fields to manually 
                override the metadata fetched from YouTube. 
                Supported keys typically include:
                - 'title': Manual song title.
                - 'artist': Manual artist/uploader name.
                - Any other attribute present on the 'Track' class.
                Values that are None or empty strings will be ignored.
                Duration is overwritten by the post-processing output value.
            _retry (bool): Internal safety flag. If True and the download fails, 
                the method will attempt to self-update yt-dlp and try exactly 
                one more time. Defaults to True.

        Returns:
            Track: An instance of the Track class populated with metadata and 
                the path to the processed audio.

        Raises:
            RuntimeError: If yt-dlp exits with a non-zero code or the subprocess times out.
            ValueError: If the metadata returned by yt-dlp cannot be parsed.
            Exception: Re-raises any error encountered if the retry attempt also fails.
        """

        output_path = self.base_dir / f"{youtube_id}.{self.dl_format}"
        temp_path = self.base_dir / f"{youtube_id}.{self.dl_temp_format}"

        url = f"https://www.youtube.com/watch?v={youtube_id}"

        UNIT_SEP = "\x1f"
        cmd = [
            str(self.python_bin),
            "-m",
            "yt_dlp",
            "-x", #audio only
            "-f", self.dl_format_filter, #defeat SABR fragmentation potentially
            "--audio-format", self.dl_format,
            "--audio-quality", self.dl_quality,
            "--user-agent", self.dl_user_agent,
            "--quiet",
            "--no-playlist",
            "--no-cache-dir", #prevents using stale cached DASH fragments
            "--retries", "3",
            "--fragment-retries", "3", #network robustness for missing packets
            "--retry-sleep", "linear=1::5",
            "-o", str(temp_path), #ytdlp requires temporary format
            "--extractor-args", "youtube:player_client=default,-android_sdkless",
            "--js-runtimes", f"deno:{str(self.js_runtime_bin)}", #jsruntime
            "--ffmpeg-location", str(self.ffmpeg_dir), #explicitly provide ffmpeg location
            "--print", f"after_move:%(id)s{UNIT_SEP}%(title)s{UNIT_SEP}%(uploader)s{UNIT_SEP}%(duration)s", #complete print after download
            url
        ]

        logger.info(f"Starting download: {youtube_id}")

        try:
            code, out, err = await self._run_command(cmd)

            if code != 0:
                logger.error(f"yt-dlp download failed with code {code}: {err}")
                return False

            logger.info("yt-dlp downloaded successfully.")

            #parse
            try: 
                line = out.strip().splitlines()[0] #first line
                raw_id, raw_title, raw_uploader, raw_duration = line.split(UNIT_SEP)

                logger.info(f"{raw_id} | {raw_title} | {raw_uploader} | {raw_duration}")
            except Exception as e:
                logger.error(f"Failed to parse metadata: {e}")

            return True

        except Exception as e:
            logger.exception(f"Unexpected error during yt-dlp download: {e}")
            return False
