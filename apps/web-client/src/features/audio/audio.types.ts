export interface AudioState {
    src: string;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
}

export interface AudioStrategy {
    strategy: "ios-stream" | "standard";

    load(trackId: string): Promise<void>;
    
    play(): Promise<void>;

    pause(): void;

    isPaused(): boolean;

    cleanup(): void;
}