import type { AudioStrategy } from "@/features/audio/audio.types";
import { StandardStrategy } from "@/features/audio/strategies/StandardStrategy";

export class audioController {
    private strategy: AudioStrategy;

    constructor(outputElement: HTMLAudioElement) {
        this.strategy = new StandardStrategy(outputElement);
    }

    public async playTrack(trackId: string) {
        await this.strategy.load(trackId);
        await this.strategy.play();
    }
}