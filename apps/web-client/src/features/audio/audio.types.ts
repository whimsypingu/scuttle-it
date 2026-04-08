export interface AudioStatus {
    src: string;
    isPaused: boolean;
    currentTime: number;
    duration: number;
}

export type AudioSubscriber = (status: AudioStatus) => void; //callback to trigger

export interface AudioStrategy {
    /** Discriminator for identifying the current strategy implementation */
    strategy: "ios-stream" | "standard";

    /**
     * Internal event emitter
     * Should broadcast when time updates, duration changes, playback state changes, or ends.
     * @param callbackFn - Function receiving the AudioStatus
     * @returns Cleanup function to remove the listener
     */
    subscribe(callbackFn: AudioSubscriber): () => void;

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
     * Subscribes a callback to audio state changes (time, duration, play, pause, ended)
     * @param callbackFn - Function receiving the latest AudioStatus
     * @returns An unsubscribe function to clean up the effect
     */
    subscribe(callbackFn: AudioSubscriber): () => void;

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