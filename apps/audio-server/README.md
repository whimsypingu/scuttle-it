# Audio Server

The backend engine for Scuttle-it, responsible for audio archival, metadata management, and streaming.

## Stack
- Framework: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- Database: [SQLite](https://www.sqlite.org/index.html)
- Async Processing: [Uvicorn](https://www.uvicorn.org/)
- Audio Processing: [FFmpeg](https://ffmpeg.org/) (External dependency)
- JS Runtime: [deno](https://deno.com/) (Download dependency)
- Tunnel: [cloudflared](https://github.com/cloudflare/cloudflared)
