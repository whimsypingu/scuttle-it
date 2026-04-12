import type { AudioCallback, AudioEvent, AudioEventListeners, AudioEventMap, AudioStrategy } from "@/features/audio/audio.types";

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
    private internalEl: HTMLAudioElement | null = null; //hidden source element

    private _needsRebuild: boolean = true;
    private _savedState: { src: string; currentTime: number } | null = null;

    private currentTrackId: string | null = null;
    private audioEl: HTMLAudioElement = new Audio();

    private constructor() {
        console.log("[IOSStrategy] Constructor triggered.");
    }

    private bindAudioEvents(el: HTMLAudioElement) {
        el.onplay = () => {
            console.log("[IOSStrategy] play");
            this.emit("play", false); //isPaused = false            
        };
        el.onpause = () => {
            console.log("[IOSStrategy] pause");
            this.emit("pause", true); //isPaused = true
            this._savedState = {
                src: el.src,
                currentTime: el.currentTime,
            };
        };
        el.ontimeupdate = () => {
            console.debug(`[IOSStrategy] timeupdate: ${el.currentTime}`); //too noisy 
            if ("mediaSession" in navigator && el.duration) {
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

    private setupContextListeners() {
        if (!this.audioCtx) {
            this._needsRebuild = true;
            return;
        };

        this.audioCtx.onstatechange = () => {
            console.log(`[IOSStrategy] audioCtx state: ${this.audioCtx?.state}`);

            if (this.audioCtx?.state !== "running" && this.internalEl) {
                this._needsRebuild = true;
                this._savedState = {
                    src: this.internalEl.src,
                    currentTime: this.internalEl.currentTime,
                }
                console.log("[IOSStrategy] Graph desync detected, rebuild flagged.");
            }
        };
    }

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

    private async rebuildContext() {
        //clean up audio ctx
        if (this.audioCtx) {
            try {
                await this.audioCtx.close();
                console.log("[IOSStrategy] audioCtx closed");
            } catch (e) {
                console.log("[IOSStrategy] Failed to close audioCtx");
            }
        }
        this.audioCtx = null;
        this.dest = null;

        this.removeInternalAudio();

        //rebuild
        this.audioCtx = new AudioContext();
        this.dest = this.audioCtx.createMediaStreamDestination();
        this.audioEl.srcObject = this.dest.stream;

        this.setupContextListeners();
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

    async load(trackId: string): Promise<void> {
        if (this._needsRebuild) {
            console.log("[IOSStrategy] Rebuilding context");
            await this.rebuildContext();
            this._needsRebuild = false;
        }

        if (!this.audioCtx || !this.dest) throw new Error("[IOSStrategy] Audio infrastructure (audioCtx | dest) missing");

        const fullUrl = `/audio/stream/${trackId}`;
        this.removeInternalAudio();
        const internalAudio = new Audio(fullUrl);
        this.internalEl = internalAudio;

        this.bindAudioEvents(internalAudio); //bind listeners

        //re-wire the source to the existing context
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

                // --- RESTORE SAVED STATE ---
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
        this.internalEl?.pause();
        this.audioEl.pause();
    }

    isPaused(): boolean {
        return this.internalEl?.paused ?? true;
    }

    seek(time: number): void {
        if (!this.internalEl || this.internalEl.readyState <= 0) {
            console.warn("[IOSStrategy] Cannot seek: Have nothing.");
            return;
        }

        const targetTime = Math.max(0, Math.min(time, this.internalEl.duration || 0)); //clamp time
        this.internalEl.currentTime = targetTime;

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

        this.audioEl.removeAttribute("src");
        this.audioEl.load(); //reset

        this.currentTrackId = null;
        console.debug("[IOSStrategy] Cleaned up.");
    }
}