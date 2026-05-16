import json
import logging
import asyncio
import re
import time
from pathlib import Path

from config import settings

logger = logging.getLogger(__name__)


class AudioProcessor:
    def __init__(
        self,
        **overrides
    ):
        self.ffmpeg_bin: Path = settings.FFMPEG_BIN_PATH
        self.ffprobe_bin: Path = settings.FFPROBE_BIN_PATH

        self.target_I: float = -16
        self.target_TP: float = -1.5
        self.target_LRA: float = 11

        self.cmd_timeout: int = 120

        for key, value in overrides.items():
            if hasattr(self, key):
                setattr(self, key, value)
            else:
                logger.warning(f"AudioProcessor ignored unknown override: {key}")

        logger.info(f"AudioProcessor ready.")


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

        #0 for downloads
        valid_returncodes = (0,)

        out = stdout.decode(errors="replace").strip()
        err = stderr.decode(errors="replace").strip()

        if process.returncode not in valid_returncodes:
            if not err:
                logger.warning(f"Process caught with unknown exit code {process.returncode}, but stderr was empty. Might require manual whitelisting.")
            else:
                logger.error(f"Command failed with exit code {process.returncode}. Whitelisted returncodes: {valid_returncodes}")
            raise RuntimeError(f"Command failed with exit code {process.returncode}: {err}")

        return (out, err)
    

    def _get_temp_path(self, file_path: Path) -> Path:
        """Returns temporary file path with '.tmp' inserted before original extension. Example: 'haiku.mp3' -> 'haiku.tmp.mp3'"""
        return file_path.with_name(f"{file_path.stem}.tmp{file_path.suffix}")
    

    def _remove_file(self, file_path: Path):
        if file_path.exists():
            file_path.unlink()


    def _replace_file(self, original_path: Path, temp_path: Path):
        self._remove_file(original_path)
        temp_path.rename(original_path)
    

    async def clean(self, file_path):
        start_time = time.perf_counter()
        temp_path = self._get_temp_path(file_path)

        #first pass, include silence removal to prevent multiple file writes (each one adds ~12s to processing time)
        cmd_analyze = [
            self.ffmpeg_bin, "-y", 
            "-i", str(file_path), 
            "-af", 
            (
                "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-50dB:detection=peak,"
                "areverse,"
                "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-50dB:detection=peak,"
                "areverse,"
                "aresample=48000,"
                f"loudnorm=I={self.target_I}:TP={self.target_TP}:LRA={self.target_LRA}:print_format=json"
            ),
            "-f", "null", "-"
        ]
        try:
            _, analysis_stderr = await self._run_command(cmd_analyze)
        except Exception as e:
            self._remove_file(temp_path)
            raise RuntimeError("Audio analysis failed")

        #extract loudnorm analytics
        #https://stackoverflow.com/questions/71791529/ffmpeg-loudnorm-reading-json-data
        match = re.search(r"\{[\s\S]*\}", analysis_stderr)
        if not match:
            raise RuntimeError("Loudnorm extraction failed")
        
        stats = json.loads(match.group())

        #second pass, only use one file write, and do it here
        cmd_apply = [
            self.ffmpeg_bin, "-y",
            "-i", str(file_path),
            "-af",
            (
                "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-50dB:detection=peak,"
                "areverse,"
                "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-50dB:detection=peak,"
                "areverse,"

                f"loudnorm=I={self.target_I}:TP={self.target_TP}:LRA={self.target_LRA}:"
                f"measured_I={stats['input_i']}:"
                f"measured_TP={stats['input_tp']}:"
                f"measured_LRA={stats['input_lra']}:"
                f"measured_thresh={stats['input_thresh']}:"
                f"offset={stats['target_offset']}:"
                "linear=true"
            ),
            "-c:a", "aac",
            "-b:a", "192k",
            str(temp_path)
        ]
        try:
            _, _ = await self._run_command(cmd_apply)
            self._replace_file(file_path, temp_path)
        except Exception as e:
            self._remove_file(temp_path)
            raise RuntimeError("Audio cleaning failed")
        
        elapsed_time = time.perf_counter() - start_time
        logger.info(f"Cleaned audio file in {elapsed_time:.2f}s: {file_path}")


# if __name__ == "__main__":
#     ap = AudioProcessor()

#     start_time = time.perf_counter()
#     asyncio.run(ap.clean(Path("C:/Projects/scuttle_rebuild/apps/audio-server/core/audio/HU7ndIT06Ys.m4a")))
#     elapsed_time = time.perf_counter() - start_time

#     print(f"\nTotal execution time: {elapsed_time:.2f} seconds")

#first pass analytics
#speed=13.7x => no aresample (default upsample to 192000: https://ffmpeg.org/ffmpeg-filters.html#loudnorm)
#speed=14.3x => aresample=44100, with negligible difference in output stats from default 
#speed=15.1x => aresample=48000, with no difference in output stats from default

#second pass analytics
#saving a 3:40 song took ~28.02s (10.6MB => 3.3MB, defaults)
#saving a 3:40 song took ~29.44s (10.6MB => 5.07MB, aac encoding and 192k bitrate)