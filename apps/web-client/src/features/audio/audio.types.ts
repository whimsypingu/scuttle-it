export interface AudioStatus {
    src: string;
    isPaused: boolean;
    currentTime: number;
    duration: number;
    ended: boolean;
}


// Types for lower-level events scoped to AudioStrategy
export type AudioStrategyEventMap = {
    play: boolean;
    pause: boolean;
    timeupdate: number;
    durationchange: number;
    ended: void;
};
export type AudioStrategyEvent = keyof AudioStrategyEventMap;

export type AudioStrategyCallback<K extends AudioStrategyEvent> = (data: AudioStrategyEventMap[K]) => void; //generic callback type

export type AudioStrategyEventListeners = {
    [K in AudioStrategyEvent]: Set<AudioStrategyCallback<K>>;
};


// Types for events scoped to the AudioEngine
export type EngineOnlyEventMap = {
    mainchange: boolean;
};
export type EngineOnlyEvent = keyof EngineOnlyEventMap;

export type EngineOnlyCallback<K extends EngineOnlyEvent> = (data: EngineOnlyEventMap[K]) => void;

export type EngineOnlyEventListeners = {
    [K in EngineOnlyEvent]: Set<EngineOnlyCallback<K>>;
};


// Unified types
export type AudioEngineEventMap = AudioStrategyEventMap & EngineOnlyEventMap;
export type AudioEngineEvent = keyof AudioEngineEventMap;

export type AudioEngineCallback<K extends AudioEngineEvent> = (data: AudioEngineEventMap[K]) => void;


export interface AudioStrategy {
    /** Discriminator for identifying the current strategy implementation */
    strategy: "ios-stream" | "standard";

    /**
     * Registers a listener for a specific audio event. Use for granular updates per event
     * @param event - The specific AudioStrategyEvent to listen for
     * @param callback - Function receiving event-specific data to trigger
     * @returns An unsubscribe function to clean up the effect
     */
    on<K extends AudioStrategyEvent>(event: K, callback: AudioStrategyCallback<K>): () => void;

    /**
     * Returns the ID of the track currently loaded in the media element.
     * Useful for checking if a 'load' call is necessary.
     */
    getCurrentTrackId(): string | null;

    /**
     * Connects a track source to the audio element.
     * Behavior: should transition the audio state to 'loading' and set a currentTrackId.
     * If the track is already loaded, it should resolve immediately
     * @param trackId
     */
    load(trackId: string): Promise<void>;
    
    /**
     * Resumes or starts playback.
     * @throws {Error} If called before a source is loaded (console error)
     */
    play(): Promise<void>;

    /**
     * Pauses playback.
     * Behavior: should be synchronous and immediate.
     */
    pause(): void;

    /**
     * @returns True if the audio is explicitly paused or hasn't been started.
     */
    isPaused(): boolean;

    /**
     * Jumps audio to a timestamp
     * Behavior: should clamp target time to 0 or maximum available duration.
     * @throws {Error} If called on audio that isn't ready yet (console error)
     * @param time - Target time in seconds
     */
    seek(time: number): void;

    /**
     * Behavior: defaults to 0 if called on audio that isn't ready yet
     * @returns Current playback time in seconds.
     */
    getCurrentTime(): number;

    /**
     * Behavior: defaults to 0 if called on audio that isn't ready yet
     * @returns The total length of the loaded track in seconds.
     */
    getDuration(): number;

    /**
     * Behavior: delete all audio stuff and set to blank.
     */
    clear(): void;
}

export interface IAudioEngine {
    /**
     * Registers a listener for a specific audio event. Use for granular updates per event
     * @param event - The specific AudioStrategyEvent to listen for
     * @param callback - Function receiving event-specific data to trigger
     */
    on<K extends AudioEngineEvent>(event: K, callback: AudioEngineCallback<K>): () => void;

    /**
     * Loads and plays a specific track
     * @param options.trackId - The unique identifier of the track
     * @param options.forceRestart (Optional) - If true, seeks to 0 even if the track was already loaded
     */
    playTrack(options: PlayTrackOptions): Promise<void>;

    /**
     * Toggles playback state. If a new trackId is provided it attempts to load that one over the existing trackId
     * @param options.trackId (Optional) - If no trackId is provided, it toggles the current strategy's state
     */
    playPauseTrack(options: PlayPauseTrackOptions): Promise<void>;

    /**
     * Forces audio to pause no matter what
     */
    pauseTrack(): void;

    /**
     * @returns True if the audio is explicitly paused or hasn't been started.
     */
    isPaused(): boolean;

    /**
     * Moves the playback head to a timestamp within an already loaded track
     * @param time - The target time in seconds
     */
    seek(time: number): void;

    /**
     * For reactive UI, use .subscribe()
     * @returns The current time in seconds of the currently loaded track
     */
    getCurrentTime(): number;

    /**
     * @returns the total length of the currently loaded track in seconds
     */
    getDuration(): number;

    /**
     * Behavior: delete all audio stuff and set to blank.
     */
    clear(): void;

    /**
     * @returns Internal isMain field for whether to allow audio or not.
     */
    getMain(): boolean;

    /**
     * Sets the internal isMain flag and emits new value.
     */
    setMain(value: boolean): void;
}

//interfaces for functions within IAudioEngine
export interface PlayTrackOptions {
    trackId: string;
    forceRestart?: boolean;
}
export interface PlayPauseTrackOptions {
    trackId?: string;
}


//payloads to send
export interface FlushListenDurationPayload {
    trackId: string;
    timestamp: number;
    listenDuration: number;
}