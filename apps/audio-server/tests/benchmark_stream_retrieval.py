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
            
        sample_size = 100
        random_test_ids = random.sample(all_ids, sample_size)
        
        print(f"Selected {sample_size} random IDs to stress-test filesystem variance.")
        print("\n--- Running Randomized Benchmark (1,000 iterations per ID) ---")
        
        total_execution_time = 0.0
        
        # Loop through each random ID and track cumulative execution times
        for test_id in random_test_ids:
            execution_time = timeit.timeit(
                stmt=lambda: original_resolve_track_path(test_id, data_dir),
                number=1000
            )
            total_execution_time += execution_time
            
        # Calculate overall averages
        total_lookups = sample_size * 1000
        avg_time_ms = (total_execution_time / total_lookups) * 1000
        
        print(f"Total lookups executed: {total_lookups:,}")
        print(f"Total time across all tests: {total_execution_time:.5f} seconds")
        print(f"True average time per single lookup: {avg_time_ms:.5f} milliseconds")

        
if __name__ == "__main__":
    run_benchmark()