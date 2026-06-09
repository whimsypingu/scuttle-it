import random
import string
import timeit
import tempfile
from pathlib import Path

# Simulate original file retrieval function setup
def original_resolve_track_path(track_id: str, data_dir: Path) -> Path:
    for ext in [".flac", ".m4a", ".mp3"]:
        file_path = data_dir / f"{track_id}{ext}"
        if file_path.exists():
            return file_path
    raise FileNotFoundError(f"Track {track_id} not found")

def generate_youtube_id() -> str:
    """Generates a random 11-character YouTube-like video ID."""
    alphabet = string.ascii_letters + string.digits + "-_"
    return "".join(random.choice(alphabet) for _ in range(11))

def run_benchmark():
    with tempfile.TemporaryDirectory() as tmp_dir_name:
        data_dir = Path(tmp_dir_name)
        
        print("Generating 10,000 unique YouTube-style IDs...")
        all_ids = []
        
        # Populate with 10,000 realistic dummy track files
        for _ in range(10000):
            yt_id = generate_youtube_id()
            all_ids.append(yt_id)
            
            # Mix up the extensions randomly to make the disk look natural
            ext = random.choice([".mp3", ".m4a", ".flac"])
            (data_dir / f"{yt_id}{ext}").touch()
            
        # Select an ID from near the end of the collection to test a realistic search
        target_id = all_ids[-50] 
        
        print(f"Target sample ID chosen for testing: '{target_id}'")
        print("\n--- Running Benchmark (1,000 iterations) ---")
        
        # Time how long it takes to run your exact function 1,000 times
        execution_time = timeit.timeit(
            stmt=lambda: original_resolve_track_path(target_id, data_dir),
            number=1000
        )
        
        avg_time_ms = (execution_time / 1000) * 1000
        
        print(f"Total time for 1,000 lookups: {execution_time:.5f} seconds")
        print(f"Average time per single lookup: {avg_time_ms:.5f} milliseconds")

if __name__ == "__main__":
    run_benchmark()