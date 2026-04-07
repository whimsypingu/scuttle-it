import type { AudioStrategy } from "@/features/audio/audio.types";

export class StandardStrategy implements AudioStrategy {
    readonly strategy = "standard";

    private static instance: StandardStrategy

    private currentTrackId: string | null = null;
    private audioEl: HTMLAudioElement = new Audio();

    private constructor() {
        //this.audioEl.preload
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
            console.debug("[StandardStrategy] Track already loaded, skipping.");
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

    cleanup(): void {
        this.pause();

        this.audioEl.removeAttribute("src");
        this.audioEl.load(); //reset

        this.currentTrackId = null;
        console.debug("[StandardStrategy] Cleaned up.");
    }
}