import type { AudioStrategy, AudioSubscriber, IAudioEngine } from "./audio.types";
import { StandardStrategy } from "./strategies/StandardStrategy";

class AudioEngine implements IAudioEngine  {
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

    public subscribe(callbackFn: AudioSubscriber) {
        return this.strategy.subscribe(callbackFn);
    }

    public async playTrack(trackId: string, forceRestart: boolean = false) {
        await this.strategy.load(trackId);

        if (forceRestart) {
            this.strategy.seek(0); //reset
        }

        await this.strategy.play();
    }

    public async playPauseTrack(trackId: string) {
        if (this.strategy.isPaused()) {
            await this.strategy.load(trackId);
            await this.strategy.play();
        } else {
            this.strategy.pause();
        }
    }

    public seek(time: number): void {
        this.strategy.seek(time);
    }

    public currentTime() {
        return this.strategy.currentTime();
    }

    public duration() {
        return this.strategy.duration();
    }
}

export const audioEngine = AudioEngine.getInstance();