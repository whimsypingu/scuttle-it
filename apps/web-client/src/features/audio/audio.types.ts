export interface AudioStatus {
    src: string;
    isPaused: boolean;
    currentTime: number;
    duration: number;
}

export type AudioSubscriber = (status: AudioStatus) => void; //callback to trigger

export interface AudioStrategy {
    strategy: "ios-stream" | "standard";

    subscribe(callbackFn: AudioSubscriber): () => void;

    load(trackId: string): Promise<void>;
    
    play(): Promise<void>;

    pause(): void;

    isPaused(): boolean;

    seek(time: number): void;

    currentTime(): number;
    duration(): number;

    cleanup(): void;
}

export interface IAudioEngine {
    subscribe(callbackFn: AudioSubscriber): () => void;
    playTrack(trackId: string, forceRestart: boolean): Promise<void>;
}