import type { AudioStrategy } from "@/features/audio/audio.types";

export class StandardStrategy implements AudioStrategy {
    readonly strategy = "standard";

    private currentTrackId: string | null = null;
    private element: HTMLAudioElement;

    constructor(element: HTMLAudioElement) {
        this.element = element;
    }

    async load(trackId: string): Promise<void> {
        const fullUrl = `/audio/stream/${trackId}`;

        //prevent reloading if the same track is already set
        if (this.currentTrackId === trackId && this.element.src.includes(fullUrl)) {
            console.debug("[StandardStrategy] Track already loaded, skipping.");
            return;
        }

        this.currentTrackId = trackId;
        this.element.src = fullUrl;
        this.element.load();

        return new Promise((resolve, reject) => {
            const handleCanPlay = () => {
                resolve();
            };

            const handleError = (e: ErrorEvent) => {
                reject(e);
            };

            this.element.addEventListener("canplaythrough", handleCanPlay, { once: true });
            this.element.addEventListener("error", handleError as any, { once: true });
        });
    }

    async play(): Promise<void> {
        if (!this.element.src) {
            console.warn("[StandardStrategy] Cannot play: No source loaded.");
            return;
        }

        try {
            await this.element.play();
        } catch (err) {
            console.error("[StandardStrategy] Playback failed:", err);
            throw err;
        }
    }

    pause(): void {
        this.element.pause();
    }

    isPaused(): boolean {
        return this.element.paused;
    }

    cleanup(): void {
        this.pause();

        this.element.removeAttribute("src");
        this.element.load(); //reset

        this.currentTrackId = null;
        console.debug("[StandardStrategy] Cleaned up.");
    }
}