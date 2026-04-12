import type { AudioCallback, AudioEvent, AudioEventListeners, AudioEventMap, AudioStrategy } from "@/features/audio/audio.types";


/**
 * CREDIT: 
 * The solution to iOS web audio autoplay, locked screen play, and tabbed out playing is from this post and commenter u/matteason on reddit.
 * 
 * Post: https://www.reddit.com/r/webdev/comments/1ldjqa1/safari_web_audio_api_issue_audiocontext_silently/
 * Solution comment: https://www.reddit.com/r/webdev/comments/1ldjqa1/comment/mymw7v3/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button
 * Solution demo: https://codepen.io/matteason/pen/VYwdzVV?editors=1010
 * Initial scuttle implementation (Vanilla JS): https://github.com/whimsypingu/scuttle/blob/main/frontend/js/features/audio/lib/streamTrick.js
 */

export class IOSStrategy implements AudioStrategy {
    readonly strategy = "ios-stream";

    private static instance: IOSStrategy
    private listeners: AudioEventListeners = {
        play: new Set(),
        pause: new Set(),
        timeupdate: new Set(),
        durationchange: new Set(),
        ended: new Set(),
    };

    // --- state variables ---
    private audioCtx: AudioContext | null = null;
    private dest: MediaStreamAudioDestinationNode | null = null;
    private internalEl: HTMLAudioElement | null = null; //variable to point to hidden source element

    private _needsRebuild: boolean = true; //flag for rebuilding audioContext
    private _savedState: { src: string; currentTime: number } | null = null; //save the last used position

    private currentTrackId: string | null = null;
    private audioEl: HTMLAudioElement = new Audio(); //main persistent audio output node

    private constructor() {
        console.log("[IOSStrategy] Constructor triggered.");
    }

    //binds the audio events to the hidden track element which is provided as an 'el' field
    private bindAudioEvents(el: HTMLAudioElement) {
        el.onplay = () => {
            console.log("[IOSStrategy] play");
            this.emit("play", false); //isPaused = false
        };
        el.onpause = () => {
            console.log("[IOSStrategy] pause");
            this.emit("pause", true); //isPaused = true
            this._savedState = { //aggressively save the state of playback when pause is triggered
                src: el.src,
                currentTime: el.currentTime,
            };
        };
        el.ontimeupdate = () => {
            console.debug(`[IOSStrategy] timeupdate: ${el.currentTime}`); //too noisy, send to debug logs
            if ("mediaSession" in navigator && el.duration) { //force mediaSession to show the correct status of the hidden audio element
                navigator.mediaSession.setPositionState({
                    duration: el.duration,
                    playbackRate: el.playbackRate,
                    position: el.currentTime,
                })
            }
            this.emit("timeupdate", el.currentTime);
        };
        el.ondurationchange = () => {
            console.log(`[IOSStrategy] durationchange: ${el.duration}`);
            this.emit("durationchange", el.duration);
        };
        el.onended = () => {
            console.log("[IOSStrategy] ended");
            this.emit("ended", undefined);
        };
    }

    /**
     * Monitors the AudioContext state for hardware-level interruptions to set an internal _needsRebuild flag.
     * This detects when context becomes unresponsive on iOS (from calls, other apps) so we can trigger a rebuild on next interaction
     */
    private observeAudioHealth() {
        if (!this.audioCtx) { //no context exists, must rebuild
            this._needsRebuild = true;
            return;
        };

        this.audioCtx.onstatechange = () => {
            console.log(`[IOSStrategy] audioCtx state: ${this.audioCtx?.state}`);

            // AudioContext isn't running (suspended, interrupted) but an active track reference exists which likely means audio graph is broken
            if (this.audioCtx?.state !== "running" && this.internalEl) {
                this._needsRebuild = true;
                this._savedState = { //snapshot for last known good configuration for post-rebuild
                    src: this.internalEl.src,
                    currentTime: this.internalEl.currentTime,
                }
                console.log("[IOSStrategy] Graph desync detected, rebuild flagged.");
            }
        };
    }

    /**
     * Remove internal audio element if it exists, to prevent overlapping audios from lost audio elements in memory
     */
    private removeInternalAudio() {
        if (this.internalEl) {
            console.log("[IOSStrategy] Cleaning up old internalEl");
            
            // 1. Stop playback
            this.internalEl.pause();
            
            // 2. Remove all internal event listeners to prevent memory leaks
            this.internalEl.oncanplaythrough = null;
            this.internalEl.onplay = null;
            this.internalEl.onpause = null;
            this.internalEl.ontimeupdate = null;
            this.internalEl.onended = null;
            this.internalEl.onerror = null;

            // 3. Force the browser to drop the resource
            this.internalEl.src = ""; 
            this.internalEl.load(); // This flushes the buffer on iOS
            
            // 4. Remove from DOM if it was ever appended
            if (this.internalEl.parentNode) {
                this.internalEl.parentNode.removeChild(this.internalEl);
            }

            this.internalEl = null;            
        }
    }

    /**
     * Executes a full teardown and reconstruction of the audio graph.
     * Creates a fresh AudioContext and reconnects it to the outward facing audioEl.
     */
    private async rebuildContext() {
        // DISPOSAL part, close existing context to free up hardware
        if (this.audioCtx) {
            try {
                await this.audioCtx.close();
                console.log("[IOSStrategy] audioCtx closed");
            } catch (e) {
                console.log("[IOSStrategy] Failed to close audioCtx");
            }
        }
        this.audioCtx = null; //reset references so old graph is garbage collected
        this.dest = null;

        this.removeInternalAudio(); //completely destroy hidden source audio to prevent ghost nodes (overlapping audios)

        // REBUILD part
        try {
            this.audioCtx = new AudioContext();
            this.dest = this.audioCtx.createMediaStreamDestination(); //create a 'sink' node where internal audio gets piped
            this.audioEl.srcObject = this.dest.stream; //atttach the stream to the persistent outward facing audioEl to allow lockscreen play

            this.observeAudioHealth(); //re-attach the monitor functions for when context fails (re-trigger _needsRebuild flag)

            console.log("[IOSStrategy] AudioContext rebuilt successfully");
        } catch (err) {
            console.error("[IOSStrategy] Critical failure during AudioContext rebuild:", err);
            this._needsRebuild = true; //flag for rebuild on next interaction
        }
    }

    //hook the set of functions to call on the actual audio element
    private emit<K extends AudioEvent>(event: K, data: AudioEventMap[K]) {
        const eventSet = this.listeners[event];
        if (eventSet) {
            eventSet.forEach((callback) => callback(data));
        }
    }

    //subscription to an event with the function to call
    public on<K extends AudioEvent>(event: K, callback: AudioCallback<K>) {
        this.listeners[event].add(callback);
        return () => this.listeners[event].delete(callback);
    }

    public static getInstance(): IOSStrategy {
        if (!IOSStrategy.instance) {
            IOSStrategy.instance = new IOSStrategy();
        }
        return IOSStrategy.instance;
    }

    public getCurrentTrackId(): string | null {
        return this.currentTrackId;
    }

    /**
     * Loads a track into the iOS-specific pipeline.
     * 1) Checks if the AudioContext needs a self-healing rebuild step
     * 2) Swaps the internalAudio element while keeping the audioContext if healthy
     * 3) Restores playback position if a snapshot exists and matches the requested track
     * 4) Bridges the new source to the persistent output audioEl
     * @param trackId
     * @returns Promise that resolves when the internal audio is buffered enough to play
     */
    async load(trackId: string): Promise<void> {
        if (this._needsRebuild) { //rebuild AudioContext if the flag was set by observeAudioHealth()
            console.log("[IOSStrategy] Rebuilding context");
            await this.rebuildContext();
            this._needsRebuild = false; //reset flag
        }

        // Safety and type check: ensure infrastructure is not null before attempting to wire stuff up
        if (!this.audioCtx || !this.dest) throw new Error("[IOSStrategy] Audio infrastructure (audioCtx | dest) missing");

        const fullUrl = `/audio/stream/${trackId}`;

        this.removeInternalAudio(); //destroy the previous internal audio element to prevent overlapping audio

        //create hidden source to handle the actual data fetch
        const internalAudio = new Audio(fullUrl);
        this.internalEl = internalAudio;

        //bind internal events to the public emitters
        this.bindAudioEvents(internalAudio);

        /**
         * Re-wire:
         * Create a MediaElementSource from the hidden audio and pipe it into the MediaStreamDestination 
         * to keep the persistent audioEl connected to a constant stream which allows autoplay on iOS
         * because the thing playing audio is technically not changing when tabbed out
         */
        const sourceNode = this.audioCtx.createMediaElementSource(internalAudio);
        sourceNode.connect(this.dest);
        console.log("[IOSStrategy] Node connected");

        this.currentTrackId = trackId;

        return new Promise((resolve, reject) => {
            const cleanup = () => {
                internalAudio.removeEventListener("canplaythrough", handleCanPlay);
                internalAudio.removeEventListener("error", handleError);
            };

            const handleCanPlay = () => {
                //state restoration
                if (this._savedState && this._savedState.src.includes(trackId)) {
                    try {
                        console.log(`[IOSStrategy] Restoring currentTime to: ${this._savedState.currentTime}`);
                        internalAudio.currentTime = this._savedState.currentTime;
                    } catch (err) {
                        console.warn("[IOSStrategy] Failed to restore currentTime", err);
                    }
                }

                cleanup();
                resolve();
            };

            const handleError = (e: ErrorEvent) => {
                cleanup();
                reject(e);
            };

            internalAudio.addEventListener("canplaythrough", handleCanPlay, { once: true });
            internalAudio.addEventListener("error", handleError, { once: true });

            internalAudio.load();

            this.audioEl.play().catch(() => console.log("[IOSStrategy] Stream play deferred until user gesture"));
        });
    }

    async play(): Promise<void> {
        if (!this.internalEl || !this.audioCtx) {
            console.warn("[IOSStrategy] Cannot play: Graph not initialized.");
            return;
        }

        try {
            const trackPlayPromise = this.internalEl.play();
            const audioPlayPromise = this.audioEl.play();

            await Promise.all([trackPlayPromise, audioPlayPromise]);

            console.log("[IOSStrategy] Playback started successfully.");
        } catch (err) {
            console.error("[IOSStrategy] Playback failed:", err);
            throw err;
        }
    }

    pause(): void {
        this.internalEl?.pause(); //stop actual audio source
        this.audioEl.pause(); //stop the output speaker element
    }

    isPaused(): boolean {
        return this.internalEl?.paused ?? true; //returns true when no audio source is available
    }

    seek(time: number): void {
        if (!this.internalEl || this.internalEl.readyState <= 0) {
            console.warn("[IOSStrategy] Cannot seek: Have nothing.");
            return;
        }

        const targetTime = Math.max(0, Math.min(time, this.internalEl.duration || 0)); //clamp time
        this.internalEl.currentTime = targetTime;

        //snapshot the last correct state of the audio in case of audio graph rebuild
        this._savedState = {
            src: this.internalEl.src,
            currentTime: this.internalEl.currentTime,
        }
    }

    getCurrentTime(): number {
        return this.internalEl?.currentTime || 0;
    }

    getDuration(): number {
        return this.internalEl?.duration || 0;
    }

    clear(): void {
        this.pause();
        this.removeInternalAudio(); //destroy internal audio source

        this.audioEl.removeAttribute("src");
        this.audioEl.load(); //reset

        this.currentTrackId = null;
        console.debug("[IOSStrategy] Cleaned up.");
    }
}