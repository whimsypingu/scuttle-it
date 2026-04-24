import type { AudioCallback, AudioEvent, AudioEventListeners, AudioEventMap, AudioStrategy } from "@/features/audio/audio.types";

export class StandardStrategy implements AudioStrategy {
    readonly strategy = "standard";

    private static instance: StandardStrategy
    private listeners: AudioEventListeners = {
        play: new Set(),
        pause: new Set(),
        timeupdate: new Set(),
        durationchange: new Set(),
        ended: new Set(),
    };

    private currentTrackId: string | null = null;
    private audioEl: HTMLAudioElement = new Audio();

    private constructor() {
        console.log("[StandardStrategy] Constructor triggered.");

        this.audioEl.addEventListener("play", () => {
            console.log("[StandardStrategy] play");
            this.emit("play", false); //isPaused = false
        });
        this.audioEl.addEventListener("pause", () => {
            console.log("[StandardStrategy] pause");
            this.emit("pause", true); //isPaused = true
        });
        this.audioEl.addEventListener("timeupdate", () => {
            console.debug(`[StandardStrategy] timeupdate: ${this.audioEl.currentTime}`); //too noisy send to debug logs
            this.emit("timeupdate", this.audioEl.currentTime);
        });
        this.audioEl.addEventListener("durationchange", () => {
            console.log(`[StandardStrategy] durationchange: ${this.audioEl.duration}`);
            this.emit("durationchange", this.audioEl.duration);
        });
        this.audioEl.addEventListener("ended", () => {
            console.log("[StandardStrategy] ended");
            this.emit("ended", undefined);
        });
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

    public static getInstance(): StandardStrategy {
        if (!StandardStrategy.instance) {
            StandardStrategy.instance = new StandardStrategy();
        }
        return StandardStrategy.instance;
    }

    public getCurrentTrackId(): string | null {
        return this.currentTrackId;
    }

    async load(trackId: string): Promise<void> {
        const fullUrl = `/audio/stream/${trackId}?t=${Date.now()}`;

        //prevent reloading if the same track is already set
        if (this.currentTrackId === trackId && this.audioEl.src.includes(fullUrl)) {
            console.log("[StandardStrategy] Track already loaded, skipping.");

            if (this.audioEl.ended) {
                this.audioEl.currentTime = 0;
            }

            return;
        }

        this.currentTrackId = trackId;
        this.audioEl.src = fullUrl;

        return new Promise((resolve, reject) => {
            const cleanup = () => {
                this.audioEl.removeEventListener("canplaythrough", handleCanPlay);
                this.audioEl.removeEventListener("error", handleError);
            };

            const handleCanPlay = () => {
                cleanup();
                resolve();
            };

            const handleError = (e: ErrorEvent) => {
                cleanup();
                reject(e);
            };

            this.audioEl.addEventListener("canplaythrough", handleCanPlay, { once: true });
            this.audioEl.addEventListener("error", handleError, { once: true });

            this.audioEl.load();
        });
    }

    async play(): Promise<void> {
        if (!this.audioEl.src) {
            console.warn("[StandardStrategy] Cannot play: No source loaded.");
            return;
        }

        try {
            await this.audioEl.play();
        } catch (err) {
            console.error("[StandardStrategy] Playback failed:", err);
            throw err;
        }
    }

    pause(): void {
        this.audioEl.pause();
    }

    isPaused(): boolean {
        return this.audioEl.paused;
    }

    seek(time: number): void {
        if (this.audioEl.readyState <= 0) {
            console.warn("[StandardStrategy] Cannot seek: Have nothing.");
            return;
        }

        const targetTime = Math.max(0, Math.min(time, this.audioEl.duration || 0)); //clamp time
        this.audioEl.currentTime = targetTime;
    }

    getCurrentTime(): number {
        return this.audioEl.currentTime || 0;
    }

    getDuration(): number {
        return this.audioEl.duration || 0;
    }

    clear(): void {
        this.pause();

        this.audioEl.removeAttribute("src");
        this.audioEl.load(); //reset

        this.currentTrackId = null;
        console.log("[StandardStrategy] Cleaned up.");
    }
}