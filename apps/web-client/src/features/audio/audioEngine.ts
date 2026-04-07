import type { AudioStrategy } from "./audio.types";
import { StandardStrategy } from "./strategies/StandardStrategy";

class AudioEngine {
    private static instance: AudioEngine;
    private strategy: AudioStrategy;
    
    private constructor() {
        console.log("Audio Engine initialized");

        const isIOS = false; //EMERGENCY: temporary set to non-ios

        // this.strategy = isIOS 
        //     ? IOSStrategy.getInstance()
        //     : StandardStrategy.getInstance();
        this.strategy = StandardStrategy.getInstance();
    }

    //ensure only one AudioEngine exists
    public static getInstance(): AudioEngine {
        if (!AudioEngine.instance) {
            AudioEngine.instance = new AudioEngine();
        }
        return AudioEngine.instance;
    }

    public async playTrack(trackId: string) {
        await this.strategy.load(trackId);
        await this.strategy.play();
    }
}

export const audioEngine = AudioEngine.getInstance();