import os
import time
import tempfile
import mimetypes
from pathlib import Path

# Initialize the mimetypes database
mimetypes.init()

# ==========================================
# METHOD 1: Pathlib + Mimetypes
# ==========================================
def get_audio_size_pathlib(folder_path: Path) -> int:
    total_audio_bytes = 0
    for file in folder_path.rglob("*"):
        if file.is_file():
            mime_type, _ = mimetypes.guess_type(file)
            if mime_type and mime_type.startswith("audio/"):
                total_audio_bytes += file.stat().st_size
    return total_audio_bytes

# ==========================================
# METHOD 2: os.walk + Tuple Check (Optimized)
# ==========================================
def get_audio_size_os_walk(folder_path: Path, ext: bool) -> int:
    total_audio_bytes = 0

    AUDIO_EXTENSIONS = (
        '.MP3', '.M4A', '.FLAC'
    )
    if ext:
        AUDIO_EXTENSIONS = (
            '.MP3', '.WAV', '.FLAC', '.M4A', '.AAC', 
            '.OGG', '.OPUS', '.AIFF', '.ALAC', '.WMA'
        )
    for root, _, files in os.walk(folder_path):
        for file in files:
            if file.upper().endswith(AUDIO_EXTENSIONS):
                file_path = os.path.join(root, file)
                try:
                    total_audio_bytes += os.path.getsize(file_path)
                except (OSError, FileNotFoundError):
                    continue
    return total_audio_bytes

# ==========================================
# METHOD 3: os.scandir
# ==========================================
def get_audio_folder_size_scandir(folder_path: Path) -> int:
    """High-speed audio file scanner.
    
    Accepts a modern pathlib.Path object, but uses os.scandir 
    under the hood for blistering, single-pass metadata speeds.
    """
    total_audio_bytes = 0
    AUDIO_EXTENSIONS = (
        '.MP3', '.WAV', '.FLAC', '.M4A', '.AAC', 
        '.OGG', '.OPUS', '.AIFF', '.ALAC', '.WMA'
    )
    
    # We convert the Path to a primitive string path ONLY at the entry point
    # so the underlying OS-level C-libraries can ingest it cleanly.
    stack = [str(folder_path)]
    
    while stack:
        current_dir = stack.pop()
        try:
            # os.scandir yields 'DirEntry' objects which already contain file metadata!
            with os.scandir(current_dir) as entries:
                for entry in entries:
                    try:
                        if entry.is_dir(follow_symlinks=False):
                            stack.append(entry.path)
                        elif entry.is_file(follow_symlinks=False):
                            # Fast suffix string match
                            if entry.name.upper().endswith(AUDIO_EXTENSIONS):
                                # CRUCIAL SPEEDUP: entry.stat() fetches from cache on Windows,
                                # avoiding a second slow disk read roundtrip!
                                total_audio_bytes += entry.stat().st_size
                    except (OSError, FileNotFoundError):
                        # Safely skip permissions locks or files deleted mid-scan
                        continue
        except OSError:
            # Handle unreadable or permission-locked directories
            continue
            
    return total_audio_bytes


# ==========================================
# BENCHMARK RUNNER
# ==========================================
if __name__ == "__main__":
    print("Setting up benchmark sandbox with 1,000 nested files...")
    
    with tempfile.TemporaryDirectory() as tmp_dir:
        # Create a deep directory hierarchy
        for i in range(20):  # 20 albums
            album_dir = os.path.join(tmp_dir, f"Artist_{i}", "Album_XYZ")
            os.makedirs(album_dir, exist_ok=True)
            
            # Populate each album with a mix of audio and noise files
            for j in range(25):  # 25 audio tracks per album (500 total)
                # Fake 1MB audio file
                with open(os.path.join(album_dir, f"track_{j}.mp3"), "wb") as f:
                    f.write(b"\0" * (1024 * 1024))
                    
            for k in range(25):  # 25 layout/metadata files per album (500 total)
                # Fake 10KB images/logs
                with open(os.path.join(album_dir, f"cover_{k}.jpg"), "wb") as f:
                    f.write(b"\0" * (10 * 1024))
                with open(os.path.join(album_dir, f"info_{k}.txt"), "w") as f:
                    f.write("Metadata noise text.")

        print("Sandbox populated! Running benchmarks...\n")
        print(f"{'Method Name':<30} | {'Time Elapsed':<15} | {'Result':<15}")
        print("-" * 68)

        tmp_dir_path = Path(tmp_dir)

        # Run Test 1: Pathlib + Mimetypes
        start_1 = time.perf_counter()
        res_1 = get_audio_size_pathlib(tmp_dir_path)
        end_1 = time.perf_counter()
        time_1 = (end_1 - start_1) * 1000
        print(f"{'1. Pathlib + Mimetypes':<30} | {time_1:>10.2f} ms | {res_1 / (1024*1024):.2f} MB")

        # Run Test 2: os.walk + Tuple Check
        start_2 = time.perf_counter()
        res_2 = get_audio_size_os_walk(tmp_dir_path, ext=False)
        end_2 = time.perf_counter()
        time_2 = (end_2 - start_2) * 1000
        print(f"{'2. os.walk + Tuple Suffix':<30} | {time_2:>10.2f} ms | {res_2 / (1024*1024):.2f} MB")
        
        # Run Test 3: os.scandir
        start_3 = time.perf_counter()
        res_3 = get_audio_folder_size_scandir(tmp_dir_path)
        end_3 = time.perf_counter()
        time_3 = (end_3 - start_3) * 1000
        print(f"{'3. os.scandir':<30} | {time_2:>10.2f} ms | {res_2 / (1024*1024):.2f} MB")

        print("-" * 68)
        speedup = time_1 / time_2 if time_2 > 0 else 0
        print(f"Result: Method 2 is roughly {speedup:.1f}x faster than Method 1 on this tree.")