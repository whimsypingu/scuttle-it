import type { AudioCallback, AudioEvent, AudioStrategy, FlushListenDurationPayload, IAudioEngine, PlayPauseTrackOptions, PlayTrackOptions } from "@/features/audio/audio.types";


class AudioEngine implements IAudioEngine  {
    private static instance: AudioEngine;
    private strategy!: AudioStrategy; //! set in initialization

    private LISTEN_HEARTBEAT_INTERVAL = 30; //seconds between a heartbeat ping
    private currentTrackId: string | null = null;
    private listenDuration = 0; //seconds, floating point value
    private previousTime = 0; //delta tracking helper variable

    public setQueueFlag = false; //flag for autoplaying queue swap behavior
    
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

        this.setupListenStats();
        console.log(`[AudioEngine] Listening stats setup: ${this.strategy.strategy}`);
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

    //track listening stats
    private setupListenStats() {
        this.strategy.on("play" as AudioEvent, (callback: any) => {
            if (this.currentTrackId !== this.strategy.getCurrentTrackId()) {
                this.flushListenDuration(this.currentTrackId, this.listenDuration); //fire and forget
            }
            this.currentTrackId = this.strategy.getCurrentTrackId();
        });

        this.strategy.on("timeupdate" as AudioEvent, (callback: any) => {
            const currentTime = this.strategy.getCurrentTime();
            const delta = currentTime - this.previousTime;

            if (delta > 0 && delta < 2) { //prevent tracking large changes like scrubbing and skips
                this.listenDuration += delta;
            }
            this.previousTime = currentTime;

            //automatic heartbeat duration flush
            if (this.listenDuration >= this.LISTEN_HEARTBEAT_INTERVAL) {
                this.flushListenDuration(this.currentTrackId, this.listenDuration); //fire and forget
            }
        });

        this.strategy.on("pause" as AudioEvent, () => {
            this.flushListenDuration(this.currentTrackId, this.listenDuration);
        });

        this.strategy.on("ended" as AudioEvent, () => {
            this.flushListenDuration(this.currentTrackId, this.listenDuration);
        });
    } 

    private async flushListenDuration(trackId: string | null, listenDuration: number) {
        if (!trackId || listenDuration <= 0) return; 
        
        console.log(
            `%c[Tracker Success] Accumulated ${listenDuration}s of listening! ` +
            `Track ID: ${trackId} | Current Playback Time: ${Math.round(this.strategy.getCurrentTime())}s`, 
            'color: #10b981; font-weight: bold;'
        );
        this.listenDuration = 0; //reset internal buffer, use the passed parameter as snapshot data

        const payload: FlushListenDurationPayload = {
            trackId,
            timestamp: Math.floor(Date.now() / 1000), //traditional unix timestamp in seconds
            listenDuration,
        };

        try {
            await fetch(`/stats/increment/listen-duration`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.error("Background stat flush failed:", err);
        }
    }

    public on<K extends AudioEvent>(event: K, callback: AudioCallback<K>) {
        return this.strategy.on(event, callback);
    }

    public async playTrack({ trackId, forceRestart = false }: PlayTrackOptions) {
        const startTime = performance.now(); //diagnostic for how long it takes to load and play audio

        this.setQueueFlag = false; //set the queue swap flag to false for safety

        await this.strategy.load(trackId);

        if (forceRestart) {
            this.strategy.seek(0); //reset
        }

        await this.strategy.play(); 

        const playTime = performance.now() - startTime; //diagnostic printing
        console.log(`%c[Scuttle Metrics] ID: ${trackId}`, 'color: #3b82f6; font-weight: bold');
        console.log(`  └─ Total to Play: ${playTime.toFixed(2)}ms`);
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