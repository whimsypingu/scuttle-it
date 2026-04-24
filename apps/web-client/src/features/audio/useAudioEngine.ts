import { useEffect, useState } from "react";
import { audioEngine } from "@/features/audio/audioEngine"
import { useQueue } from "@/store/hooks/useQueue";


export const useAudioPlayback = () => {
    const [isPaused, setIsPaused] = useState(() => audioEngine.isPaused());

    useEffect(() => {
        const unSubPlay = audioEngine.on("play", (paused) => setIsPaused(paused));
        const unSubPause = audioEngine.on("pause", (paused) => setIsPaused(paused));

        return () => {
            unSubPlay();
            unSubPause();
        };
    }, []);

    return { isPaused };
}


export const useAudioTime = () => {
    const [time, setTime] = useState(() => audioEngine.getCurrentTime());
    const [duration, setDuration] = useState(() => audioEngine.getDuration());

    useEffect(() => {
        const unSubTime = audioEngine.on("timeupdate", (t) => setTime(t));
        const unSubDur = audioEngine.on("durationchange", (d) => setDuration(d));

        return () => {
            unSubTime();
            unSubDur();
        };
    }, []);

    return { time, duration };
}


export const useAudioEnded = () => {
    const [ended, setEnded] = useState(false); //maybe needs a default value?

    useEffect(() => {
        const unSubEnded = audioEngine.on("ended", () => setEnded(true));
        const unSubPlay = audioEngine.on("play", () => setEnded(false)); //reset when a new track plays

        return () => {
            unSubEnded();
            unSubPlay();
        };
    }, []);

    return { ended };
}


export const useBackupSync = () => {
    const { time, duration } = useAudioTime();
    const { refetch } = useQueue();
    const [hasSynced, setHasSynced] = useState(false);

    useEffect(() => {
        //reset sync status to limit number of refetches to one
        if (time < 5 && hasSynced) {
            setHasSynced(false);
        }

        const timeLeft = duration - time;

        //re-sync the queue to the backend with 5 seconds left in a track
        if (duration > 0 && timeLeft <= 5 && !hasSynced) {
            setHasSynced(true);
            refetch(); //for now, refetch the queue data. insignificant compared to actual audio data anyway, but could be optimized later
        }
    })
}