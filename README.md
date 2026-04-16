# Scuttle

This project is an audio archival tool for managing and playing your personal audio collection. Self-host your audio library from your laptop and stream to any device with a browser.

* Search and download audio
* Play, pause, and skip tracks

---

## Demos
*(Screenshots and links to video demos with date)*

## Project Structure
The project is organized as a monorepo to separate the concerns of data management and user interface. Each main component is found inside the `apps/` folder.

```bash
scuttle-it/
├── apps/
│   ├── audio-server/           # SQLite + FastAPI backend (Python)
│   ├── desktop-launcher/       # iced orchestrator (Rust)
│   └── web-client/             # React + vite frontend (TS)
├── .gitattributes
├── .gitignore
└── workspace.json
```

## License
Distributed under the MIT [License](./LICENSE).

*Created and maintained by whimsypingu.*

## Disclaimer
Scuttle is provided for personal and non-commercial use only.
The developer does not endorse, support, or encourage downloading copyrighted material without permission. You are solely responsible for complying with all applicable laws and the terms of service of any platforms you interact with. This project is intended to help users archive, manage, and listen to their own legally obtained audio collections. The developer is not responsible for any misuse of this software.