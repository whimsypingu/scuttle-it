![Scuttle banner](./docs/assets/readme_banner_black_background.png)
---

Scuttle is an audio archival tool for managing and playing your personal audio collection. Self-host your audio library from your laptop and stream to any device with a browser.

* Search and download audio
* Play, pause, and skip tracks
* Create and manage playlists

---

<table>
    <tr>
        <td align="center" width="60%">
            <p><b>Desktop Launcher</b> <em>(5/11/26)</em></p>
            <img src="./docs/assets/desktop_launcher_demo.png" width="600" alt="Desktop launcher demo"></img>
        </td>
        <td align="center" width="40%">
            <p><b>Web Client</b> <em>(5/11/26)</em></p>
            <video src="https://github.com/user-attachments/assets/c76482a3-96f5-4ffb-94b7-9fa0437f97e1" controls muted loop style="max-width: 100%;"></video>
        </td>
    </tr>
</table>

*(Additional screenshots and links to video demos with date)*

---

## Features
* **Completely free:** The only cost is electricity for self-hosting, and the resources for your computer to handle serving audio files.
* **Safe downloading:** Downloading is currently based on [yt-dlp](https://github.com/yt-dlp/yt-dlp).
* **Integrated orchestration:** A native desktop launcher handles the lifecycle of your server, including accessibility via a Discord webhook, and manages uptime of a Cloudflared tunnel to ensure maximum availability. On setup, installs all required software prerequisites and maintains updates of frequently updating critical packages.
* **Better queue functionality:** Swipe to queue a song to the front or the back of the queue, and swipe on playlists to play them directly.

---

## Quick Start
1. Go to **[Latest Releases](https://github.com/whimsypingu/scuttle-it/releases/latest)**.
2. Download the bundle for your OS (currently only Windows is supported).
3. Run the `scuttle` executable, and follow steps to initialize the environment and start the audio server.

---

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
