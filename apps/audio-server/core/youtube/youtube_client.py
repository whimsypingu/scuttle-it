import logging
import asyncio
from pathlib import Path

from config import settings
from core.models.track import TrackBase
from core.models.artist import ArtistBase
from core.youtube.youtube_exceptions import YtdlpDownloadError, YtdlpMetadataError, YtdlpSearchError, YtdlpTimeoutError, YtdlpUpdateError

logger = logging.getLogger(__name__)


class YouTubeClient():
    def __init__(
        self,
        **overrides
    ):
        self.data_dir: Path = settings.DATA_DIR

        self.yt_prefix: str = "" # "YT___"
        
        self.dl_format_filter: str = "bestaudio/best"
        self.dl_format: str = "m4a" #reduces size while maintaining quality and compatibility with most browsers for scrubbing
        self.dl_quality: str = "0"
        self.dl_user_agent: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
        self.dl_temp_format: str = "%(ext)s"

        self.pp_ffmpeg: str = "ffmpeg:-movflags +faststart" #moves the MOOV atom in m4a files to the front for streaming
        
        self.cmd_timeout: int = 120

        self.python_bin: Path = settings.PYTHON_BIN_PATH
        self.js_runtime_bin: Path = settings.JS_RUNTIME_BIN_PATH
        self.ffmpeg_dir: Path = settings.BIN_DIR

        for key, value in overrides.items():
            if hasattr(self, key):
                setattr(self, key, value)
            else:
                logger.warning(f"YouTubeClient ignored unknown override: {key}")

        logger.info(f"YouTubeClient ready.")


    async def _run_command(self, cmd: list[str]) -> tuple[str, str]:
        """
        Runs a system command asynchronously. Returns (stdout, stderr)

        Raises:
            asyncio.TimeoutError: If command times out
            RuntimeError: If command exits with non-zero code
        """
        logger.info(f"Executing command: {cmd[:4]}...")

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), 
                timeout=self.cmd_timeout
            )
        except asyncio.TimeoutError:
            process.kill()
            logger.error(f"Command timed out after {self.cmd_timeout}s")
            raise

        #0 for downloads, 101 for searches
        valid_returncodes = (0, 101)

        out = stdout.decode(errors="replace").strip()
        err = stderr.decode(errors="replace").strip()

        if process.returncode not in valid_returncodes:
            if not err:
                logger.warning(f"Process caught with unknown exit code {process.returncode}, but stderr was empty. Might require manual whitelisting.")
            else:
                logger.error(f"Command failed with exit code {process.returncode}. Whitelisted returncodes: {valid_returncodes}")
            raise RuntimeError(f"Command failed with exit code {process.returncode}: {err}")

        return (out, err)
        

    async def update(self) -> bool:
        """
        Update yt-dlp using the specified python binary. Returns True on success.
        
        Raises:
            YtdlpUpdateError: If the update fails
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
            out, _ = await self._run_command(cmd)

            logger.info("yt-dlp updated successfully.")
            logger.debug(f"Pip output: {out}")
            return True

        except (RuntimeError, asyncio.TimeoutError) as e:
            err_msg = f"yt-dlp update failed: {str(e)}"
            
            logger.error(err_msg)
            raise YtdlpUpdateError(err_msg) from e
        
        except Exception as e:
            logger.exception("Unexpected crash during yt-dlp update")
            raise YtdlpUpdateError("An unexpected error occurred during yt-dlp update.") from e
        

    async def download_by_youtube_id(
        self,
        youtube_id: str
    ) -> TrackBase:
        """
        Downloads a specific YouTube video as an audio file and returns a TrackBase object.

        // This method orchestrates the full download pipeline: fetching audio via yt-dlp,
        parsing metadata from the stream, applying post-processing (silence trimming, 
        loudness normalization, compression), and calculating the final duration.

        Args:
            youtube_id (str): The YouTube video ID (e.g., "dQw4w9WgXcQ")

        Returns:
            TrackBase: An instance of a TrackBase

        Raises:
            YtdlpTimeoutError: If yt-dlp times out.
            YtdlpMetadataError: If the metadata returned by yt-dlp cannot be parsed.
            YtdlpDownloadError: If yt-dlp exits with a non-zero code, or any other error.
        """

        output_path = self.data_dir / f"{youtube_id}.{self.dl_format}"
        temp_path = self.data_dir / f"{youtube_id}.{self.dl_temp_format}"

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
            "--postprocessor-args", self.pp_ffmpeg,
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
            out, err = await self._run_command(cmd)

            logger.info("yt-dlp downloaded successfully.")

            #parse
            lines = out.strip().splitlines()
            metadata_line = next((l for l in reversed(lines) if UNIT_SEP in l), None)

            if not metadata_line:
                raise YtdlpMetadataError(f"Could not find metadata line in yt-dlp output: {out}")

            parts = metadata_line.split(UNIT_SEP)
            if len(parts) != 4:
                raise YtdlpMetadataError(f"Invalid line format from yt-dlp search output: {metadata_line}")

            raw_id, raw_title, raw_uploader, raw_duration = parts

            logger.info(f"{raw_id} | {raw_title} | {raw_uploader} | {raw_duration}")

            #return value
            return TrackBase(
                id=raw_id,
                title=raw_title,
                duration=raw_duration,
                artists=[ArtistBase(
                    name=raw_uploader
                )]
            )

        except asyncio.TimeoutError as e:
            raise YtdlpTimeoutError() from e
        
        except RuntimeError as e:
            raise YtdlpDownloadError() from e            

        except Exception as e:
            logger.exception(f"Unexpected error during yt-dlp download: {e}")
            raise YtdlpDownloadError() from e
        

    async def search_by_query(
        self,
        q: str,
        limit: int = 5
    ) -> list[TrackBase]:
        """
        Search YouTube using yt-dlp for the query, and return limit number of TrackBase objects
        """

        UNIT_SEP = "\x1f"
        cmd = [
            str(self.python_bin),
            "-m",
            "yt_dlp",
            f"ytsearch{limit}:{q}",
            "--max-downloads", str(limit),
            "-S", "+size,+br,+res,+fps", #smallest file size
            "--user-agent", self.dl_user_agent,
            "--skip-download",
            "--no-cache-dir", #prevents using stale cached DASH fragments
            "--js-runtimes", f"deno:{str(self.js_runtime_bin)}", #jsruntime
            "--print", f"%(id)s{UNIT_SEP}%(title)s{UNIT_SEP}%(uploader)s{UNIT_SEP}%(duration)s"
        ]
        
        logger.info(f"Starting search: {q}")

        try:
            out, err = await self._run_command(cmd)

            logger.info("yt-dlp searched successfully.")

            #parse
            lines = out.strip().splitlines()
            if not lines:
                raise YtdlpMetadataError(f"Could not find any metadata for yt-dlp search query: {q}")
            
            results = []
            for metadata_line in lines:
                parts = metadata_line.split(UNIT_SEP)
                if len(parts) != 4:
                    raise YtdlpMetadataError(f"Invalid line format from yt-dlp search output: {metadata_line}")
                
                raw_id, raw_title, raw_uploader, raw_duration = parts
    
                logger.info(f"{raw_id} | {raw_title} | {raw_uploader} | {raw_duration}")
                
                results.append(TrackBase(
                    id=f"{self.yt_prefix}{raw_id}",
                    title=raw_title,
                    duration=int(raw_duration),
                    artists=[ArtistBase(
                        name=raw_uploader
                    )]
                ))

            return results

        except asyncio.TimeoutError as e:
            raise YtdlpTimeoutError() from e
        
        except RuntimeError as e:
            raise YtdlpSearchError() from e            

        except Exception as e:
            logger.exception(f"Unexpected error during yt-dlp search: {e}")
            raise YtdlpSearchError() from e

