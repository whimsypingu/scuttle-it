import type { AudioStrategy, AudioSubscriber, IAudioEngine, PlayPauseTrackOptions, PlayTrackOptions } from "./audio.types";
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

    public async playTrack({ trackId, forceRestart = false }: PlayTrackOptions) {
        await this.strategy.load(trackId);

        if (forceRestart) {
            this.strategy.seek(0); //reset
        }

        await this.strategy.play();
    }

    //very forgiving function that attempts to play or pause depending on state, and uses best effort for trackId
    public async playPauseTrack({ trackId }: PlayPauseTrackOptions) {
        const targetId = trackId ?? this.strategy.getCurrentTrackId();

        if (this.strategy.isPaused()) {

            //guard for trying to start a new track but have no ID and nothing is currently loaded or paused
            if (!targetId) {
                console.error("AudioEngine Error: No trackId provided and no track currently ready");
                return;
            }

            //only load if a new trackId or default to the old existing trackId
            if (targetId) {
                await this.strategy.load(targetId);
            }
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