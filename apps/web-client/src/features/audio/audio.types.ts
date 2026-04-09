export interface AudioStatus {
    src: string;
    isPaused: boolean;
    currentTime: number;
    duration: number;
    ended: boolean;
}

export type AudioEventMap = {
    play: boolean;
    pause: boolean;
    timeupdate: number;
    durationchange: number;
    ended: void;
};
export type AudioEvent = keyof AudioEventMap;

export type AudioCallback<K extends AudioEvent> = (data: AudioEventMap[K]) => void; //generic callback type

export type AudioEventListeners = {
    [K in AudioEvent]: Set<AudioCallback<K>>;
};


export interface AudioStrategy {
    /** Discriminator for identifying the current strategy implementation */
    strategy: "ios-stream" | "standard";

    /**
     * Registers a listener for a specific audio event. Use for granular updates per event
     * @param event - The specific AudioEvent to listen for
     * @param callback - Function receiving event-specific data to trigger
     * @returns An unsubscribe function to clean up the effect
     */
    on<K extends AudioEvent>(event: K, callback: AudioCallback<K>): () => void;

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

    cleanup(): void;
}

export interface IAudioEngine {
    /**
     * Registers a listener for a specific audio event. Use for granular updates per event
     * @param event - The specific AudioEvent to listen for
     * @param callback - Function receiving event-specific data to trigger
     */
    on<K extends AudioEvent>(event: K, callback: AudioCallback<K>): () => void;

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
}

//interfaces for functions within IAudioEngine
export interface PlayTrackOptions {
    trackId: string;
    forceRestart?: boolean;
}
export interface PlayPauseTrackOptions {
    trackId?: string;
}