import type { AudioCallback, AudioEvent, AudioStrategy, IAudioEngine, PlayPauseTrackOptions, PlayTrackOptions } from "@/features/audio/audio.types";


class AudioEngine implements IAudioEngine  {
    private static instance: AudioEngine;
    private strategy!: AudioStrategy; //! set in initialization
    
    private constructor() { null }

    //dynamic import the strategy to prevent downloading extra logic
    private async initializeStrategy() {
        const isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent);

        if (isAppleMobile) {
            const { IOSStrategy } = await import("@/features/audio/strategies/IOSStrategy");
            this.strategy = IOSStrategy.getInstance();
        } else {
            const { StandardStrategy } = await import("@/features/audio/strategies/StandardStrategy");
            this.strategy = StandardStrategy.getInstance();
        }

        console.log(`[AudioEngine] Strategy loaded: ${this.strategy.strategy}`);
    }

    //ensure only one AudioEngine exists, singleton creation must be awaited now due to dynamic imports
    public static async getInstance(): Promise<AudioEngine> {
        if (!AudioEngine.instance) {
            const engine = new AudioEngine();
            await engine.initializeStrategy();
            AudioEngine.instance = engine;
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

//create the singleton with lazy import
export const audioEngine = await AudioEngine.getInstance();