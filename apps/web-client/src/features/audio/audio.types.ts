export interface AudioState {
    src: string;
    currentTime: number;
}

export interface AudioStrategy {
    strategy: "ios-stream" | "standard";

    load(trackId: string): Promise<void>;
    
    play(): Promise<void>;

    pause(): void;

    isPaused(): boolean;

    cleanup(): void;
}