import type { AudioCallback, AudioEvent, AudioStrategy, IAudioEngine, PlayPauseTrackOptions, PlayTrackOptions } from "./audio.types";
import { IOSStrategy } from "./strategies/IOSStrategy";
import { StandardStrategy } from "./strategies/StandardStrategy";

class AudioEngine implements IAudioEngine  {
    private static instance: AudioEngine;
    private strategy: AudioStrategy;
    
    private constructor() {
        console.log("Audio Engine initialized");

        const isIOS = true; //EMERGENCY: temporary set to ios

        this.strategy = isIOS 
            ? IOSStrategy.getInstance()
            : StandardStrategy.getInstance();
        // this.strategy = StandardStrategy.getInstance();
    }

    //ensure only one AudioEngine exists
    public static getInstance(): AudioEngine {
        if (!AudioEngine.instance) {
            AudioEngine.instance = new AudioEngine();
        }
        return AudioEngine.instance;
    }

    public on<K extends AudioEvent>(event: K, callback: AudioCallback<K>) {
        return this.strategy.on(event, callback);
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

    public pauseTrack() {
        this.strategy.pause();
    }

    public isPaused() {
        return this.strategy.isPaused();
    }

    public seek(time: number) {
        this.strategy.seek(time);
    }

    public getCurrentTime() {
        return this.strategy.getCurrentTime();
    }

    public getDuration() {
        return this.strategy.getDuration();
    }

    public clear() {
        this.strategy.clear();
    }
}

export const audioEngine = AudioEngine.getInstance();