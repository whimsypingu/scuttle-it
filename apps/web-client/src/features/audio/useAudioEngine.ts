import { useEffect, useState } from "react";
import { audioEngine } from "./audioEngine"
import type { AudioStatus } from "./audio.types";
import { formatTime } from "./audio.utils";

export const useAudioEngine = () => {
    const [status, setStatus] = useState<AudioStatus>({
        src: "",
        isPaused: true,
        currentTime: 0,
        duration: 0
    })

    useEffect(() => {
        const unsubscribe = audioEngine.subscribe((status) => {
            setStatus(status);
        });

        return unsubscribe;
    }, []);

    return {
        isPaused: status.isPaused,
        currentTime: formatTime(status.currentTime),
        duration: formatTime(status.duration)
    }
}