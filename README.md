![Scuttle banner](./docs/assets/readme_banner_black_background.png)
---

Scuttle is an audio archival tool for managing and playing your personal audio collection. Self-host your audio library from your laptop and stream to any device with a browser. 

* [Features](#features)
* [Installation](#installation)
    * [Requirements](#requirements)
    * [Dependencies](#important-external-dependency-disclaimer)
* [Documentation](#documentation)
    * [Project Structure](#project-structure)
    * [Roadmap](#roadmap)
    * [Known Issues](#known-issues)

---

<table>
    <tr>
        <td>
            <img height="400" alt="scuttle_web_client_single_track" src="https://github.com/user-attachments/assets/bf9892fa-610b-4560-9817-ac7f2b8289a7" />
        </td>
        <td>
            <img height="400" alt="scuttle_web_client_home" src="https://github.com/user-attachments/assets/e3e2d235-b74a-4bd8-8366-dc40f39751d7" />
        </td>
        <td>
            <img height="400" alt="scuttle_web_client_queue" src="https://github.com/user-attachments/assets/de56acf2-e943-4bc2-9d69-bfead1bb79dc" />
        </td>
        <td>
            <img height="400" alt="scuttle_web_client_profile" src="https://github.com/user-attachments/assets/a93e0a8a-020a-4b65-bdc9-94c5bfee279a" />
        </td>
    </tr>
</table>

<p><em>(6/11/26)</em></p>


---

# Features

### Completely free

The only cost is electricity for self-hosting, and the resources for your computer to handle serving audio files.

<div align="center">
    <img width="300" alt="scuttle_web_client_single_track" src="https://github.com/user-attachments/assets/bf9892fa-610b-4560-9817-ac7f2b8289a7" />
    <p><em>(6/11/26)</em></p>
</div>


---

### Downloading

* **Safety:** Currently, downloading is exclusively done with [yt-dlp](https://github.com/yt-dlp/yt-dlp), and the only supported source is YouTube.

* **Reliability:** Scuttle uses the nightly version of `yt-dlp`. On download failures, automatically performs self-healing nightly version updates to the most recently available version, and then re-tries the download.

* **QOL:** Some important under the hood explanations of quality-of-life download logic that may not be apparent:
    
    * Audio from YouTube is downloaded on the first result that is found from the top 3 search results, but if a target duration is available,finds the closest track duration (to reduce cases of downloading MVs with extra unwanted audio, or versions with intros/outros).
    
    * Metadata from a YouTube download is overwritten if provided from an alternate platform's native link, otherwise a small <2 MB AI model attempts to extract and set metadata. Source code can be found on [this notebook](https://colab.research.google.com/drive/1MHd5qqSNmc9Of4HgElKvbQd45IZZ9-3I?usp=sharing).

<div align="center">
    <img width="300" alt="scuttle_web_client_search" src="https://github.com/user-attachments/assets/de89f5f0-329c-4e91-b04f-abb68caa42e5" />
    <p><em>(6/11/26)</em></p>
</div>


---

### Audio quality and compatibilty

* Audio files have a target of `192kbps` in `m4a` format for maximum device compatibility. For reference, about 3:30 of audio is around 5MB at this quality level.

* Web client streams audio with mobile device screens powered off (even on iOS devices).

* Leading and trailing silence is stripped for the purpose of optimizing file size and listening consistency.

* To eliminate volume disparity audio loudness is explicitly calibrated to **-16 LUFS** which follows [AES recommendations](https://www.radioworld.com/tech-and-gear/tech-tips/streaming-audio-loudness-guidelines-explained) for internet audio tracking.


---

### Integrated orchestration

* A native desktop launcher handles the lifecycle of your server, including accessibility via a Discord webhook, and manages uptime of a Cloudflared tunnel to ensure maximum availability. 

<div align="center">
    <img src="./docs/assets/desktop_launcher_demo.png" width="600" alt="Desktop launcher demo"></img>
    <p><em>(5/11/26)</em></p>
</div>

<pre><b>**At the cost of being free, this could mean sudden rotations of user-accessible links to the web-client if the tunnel breaks.**</b></pre>

<div align="center">
    <img width="660" alt="scuttle_desktop_launcher_healing" src="https://github.com/user-attachments/assets/ace90d09-c210-4141-8e20-f18d4d5f7361" />   
    <p><em>(6/11/26)</em></p>
</div>

* On setup, installs all required software prerequisites and maintains updates of frequently updating critical packages. See [dependencies](#important-external-dependency-disclaimer) here.

* It is recommended to change computer settings so that it stays on even with the screen off when connected to power, to ensure server uptime. This will be in effect until an anti-sleep battery-aware solution is implemented into the desktop launcher.


---

### Better queue functionality

* Swipe to queue a song to the front **or** the back of the queue.

* Swipe on playlists (just like you would a track) to play them directly. 

* Due to unavoidable download and processing time, first download/plays are immediately sent to the front of the queue when available and are **not** instantly streamable.

<div align="center">
    <img width="300" alt="scuttle_web_client_queue" src="https://github.com/user-attachments/assets/de56acf2-e943-4bc2-9d69-bfead1bb79dc" />
    <p><em>(6/11/26)</em></p>
</div>

---


### Import playlists

Use native site share links to import playlists and tracks from other sources. Paste links directly into the search bar and press `Enter` to begin downloading playlists or tracks. 

Single track links are treated like regular searches and are pushed to the front of the play queue when available, while playlists are automatically pushed to the back of the queue as they populate for an ordered listening experience.

**Currently supported sites:**

* YouTube
* Spotify

<div align="center">
    <img width="300" alt="scuttle_client_playlists" src="https://github.com/user-attachments/assets/44043675-622f-4ab1-a80a-01992c241938" />
    <p><em>(6/11/26)</em></p>
</div>


---

### Listening stats

* Track your own statistics. Your listening data doesn't go anywhere and is stored exlusively on your own device.

* Currently only a few statistics are tracked and viewable from the web client user interface:

    * Scuttle start date
    * Total listened duration
    * Total audio storage usage

<div align="center">
    <img width="300" alt="scuttle_web_client_profile" src="https://github.com/user-attachments/assets/a93e0a8a-020a-4b65-bdc9-94c5bfee279a" />   
    <p><em>(6/11/26)</em></p>
</div>


---

# Installation

1. Go to Scuttle's [Latest Releases](https://github.com/whimsypingu/scuttle-it/releases/latest) page.

2. Download the `.zip` file for your OS (currently only Windows is tested and fully supported).

3. Unzip the project into your filesystem.

4. Run the `scuttle` executable, and follow steps to initialize the environment and start the audio server. Installation may take a while.


### Requirements:
Ensure you have `python` installed on your device. (You can test this by typing `python --version` into a terminal).

### Important external dependency disclaimer:
The default Scuttle setup downloads some external binaries during installation. Here is a brief explanation of them:

* **ffmpeg/ffprobe** - Extracting and modifying audio files.

* **deno** - JavaScript runtime engine to safely execute web scraper scripts (recommended for reliable yt-dlp usage).

* **cloudflared** - Establishes free connection tunnel from your machine to the Cloudflare network, allowing you to access your Scuttle server from the internet without having to configure anything on your router.

For other dependencies that will require an internet connection to set up, see the [requirements.txt](./apps/audio-server/requirements.txt) file for the audio server.


---

# Documentation

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

---

## Roadmap
The most basic version of Scuttle is now functional. However, there are a number of planned ideas for Scuttle in the future, and here they are listed in no particular order:

- [ ] Internal artist handling improvements
    - [ ] MusicBrainz-based metadata enrichment to automatically generate additional artist song catalog after listening to one.
    - [ ] Merging artist records based on an ID to reduce duplicate artist entries for the same entity.
    - [ ] More intuitive artist selection during track editing.

- [ ] Recommendations
    - [ ] Possibly allow users to set up their own central servers, which could host playlists and provide curated recommendations. For example, someone could set up their own recommendation server with custom genres or algorithms, and other users could connect to it and get recommendations from there.
    - [ ] Auto-generate internally, either via waveform analysis (BUT this is computationally expensive), or with some kind of robust search algorithm using artist data.

- [ ] Metadata enhancement
    - [ ] Improvements to metadata extraction guesser (first iteration sitting at around 80% perfection, but with a heavy bias towards popular songs and not a wide enough array of seen training data. Source code can be found in the [download quality-of-life](#downloading) section).
    - [ ] Smart MusicBrainz auto-filling metadata if possible for consistency across the library.

- [ ] Profile
    - [ ] Saved amount price comparisons to modern streaming platforms, and suggest users buy merch or concert tickets to their favorite artists.
    - [ ] Allow multiple users to edit queue but listen on one device.
    - [ ] Separate user sessions for the same server (although this is against the original intention of this project as a single user project).
    - [ ] Show detailed analysis of user statistics, like most listened artist, longest track, etc.

- [ ] Desktop launcher functionality
    - [ ] Allow mounting another user's database and audio files easily (currently possible but only by manually editing the `.env` file).
    - [ ] Upload existing user audio files to the Scuttle system.
    - [ ] Download Scuttle audio files to elsewhere as their corrected names.
    - [ ] Allow custom tunnel configuration.
    - [ ] Allow users to restart server and tunnel from the frontend interface (may require some kind of IPC implementation).

- [ ] UI/UX
    - [ ] History queue.
    - [ ] Cancel download jobs.
    - [ ] Light mode(?)

---

## Known Issues
There are also a number of known and unfixed issues in Scuttle.

* Sometimes audio context will not resume correctly on iOS resulting in soundless audio, and requiring a pause and play.
* Audio may appear distorted and high-pitched briefly when connecting or disconnecting bluetooth on iOS.


---

## License
Distributed under the MIT [License](./LICENSE).

*Created and maintained by whimsypingu.*

## Disclaimer
Scuttle is provided for personal and non-commercial use only.
The developer does not endorse, support, or encourage downloading copyrighted material without permission. You are solely responsible for complying with all applicable laws and the terms of service of any platforms you interact with. This project is intended to help users archive, manage, and listen to their own legally obtained audio collections. The developer is not responsible for any misuse of this software.
