import React, { createContext, useContext, useEffect, useRef } from "react";
import { audioController } from "@/features/audio/audioController";

const AudioContext = createContext<audioController | null>(null);

export const AudioProvider = ({ children }: { children: React.ReactNode}) => {
    const audioRef = useRef<HTMLAudioElement>(null); //main persistent DOM audio element
    const controllerRef = useRef<audioController | null>(null); //logic for the audio

    //initialize on loading references
    useEffect(() => {
        if (audioRef.current && !controllerRef.current) {
            controllerRef.current = new audioController(audioRef.current); //link logic to element
        }
    }, []);

    //wrapper for allowing access to audio element
    return (
        <AudioContext value={controllerRef.current}>
            <audio ref={audioRef} aria-hidden="true" />
            {children}
        </AudioContext>
    );
};

//hook to access the audio element anywhere
export const useAudio = () => {
    const context = useContext(AudioContext);

    //safety check, shouldnt ever trigger
    if (context === undefined || context === null) {
        throw new Error("useAudio must be used within an AudioProvider");
    }
    return context;
};