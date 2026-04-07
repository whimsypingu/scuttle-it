import type { AudioStatus, AudioStrategy, AudioSubscriber } from "@/features/audio/audio.types";

export class StandardStrategy implements AudioStrategy {
    readonly strategy = "standard";

    private static instance: StandardStrategy
    private subscribers: Set<AudioSubscriber> = new Set();

    private currentTrackId: string | null = null;
    private audioEl: HTMLAudioElement = new Audio();

    private constructor() {
        console.log("[StandardStrategy] Constructor triggered.");

        const notify = () => {
            console.log(`[StandardStrategy] Notify to ${this.subscribers.size} subscribers with currentTime: ${this.audioEl.currentTime}`);
            
            const status: AudioStatus = {
                src: this.audioEl.currentSrc,
                isPaused: this.audioEl.paused,
                currentTime: this.audioEl.currentTime,
                duration: this.audioEl.duration
            };
            this.subscribers.forEach(callbackFn => callbackFn(status));
        };

        this.audioEl.addEventListener("play", notify);
        this.audioEl.addEventListener("pause", notify);
        this.audioEl.addEventListener("timeupdate", notify);
        this.audioEl.addEventListener("durationchange", notify);
        this.audioEl.addEventListener("ended", notify);
    }

    public subscribe(callbackFn: AudioSubscriber) {
        this.subscribers.add(callbackFn);
        return () => this.subscribers.delete(callbackFn);
    }

    public static getInstance(): StandardStrategy {
        if (!StandardStrategy.instance) {
            StandardStrategy.instance = new StandardStrategy();
        }
        return StandardStrategy.instance;
    }

    async load(trackId: string): Promise<void> {
        const fullUrl = `/audio/stream/${trackId}`;

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

    currentTime(): number {
        return this.audioEl.currentTime || 0;
    }

    duration(): number {
        return this.audioEl.duration || 0;
    }

    cleanup(): void {
        this.pause();

        this.audioEl.removeAttribute("src");
        this.audioEl.load(); //reset

        this.currentTrackId = null;
        console.debug("[StandardStrategy] Cleaned up.");
    }
}