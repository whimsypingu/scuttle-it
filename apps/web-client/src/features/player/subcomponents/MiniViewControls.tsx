import { useEffect, useState } from "react";
import { useAudioEngine } from "@/features/audio/useAudioEngine";
import { useQueue } from "@/store/hooks/useQueue";

import { PlayIcon, PauseIcon } from "@phosphor-icons/react";

import { MiniSlider } from "@/components/ui/mini-slider";

import { audioEngine } from "@/features/audio/audioEngine";

import { PLAYER_CONFIG } from "@/features/player/player.constants";


export const MiniViewPlayPauseButton = () => {
    const { queue } = useQueue(); //get the latest queue from tanstack
    const currentTrack = queue?.[0];

    const { isPaused } = useAudioEngine();

    return (
        <>
        {/* PLAY/PAUSE */}
        <button
            className="p-2 transition-transform active:scale-95"
            onClick={(e) => {
                e.stopPropagation();
                audioEngine.playPauseTrack(currentTrack?.id);
            }}
        >
            {isPaused ? (
                <PlayIcon size={PLAYER_CONFIG.iconSize} weight="fill" />
            ) : (
                <PauseIcon size={PLAYER_CONFIG.iconSize} weight="fill" />
            )}
        </button>
        </>
    );
};


export const MiniViewSlider = () => {
    const { rawTime, rawDuration } = useAudioEngine();

    //local state for the slider
    const [isDragging, setIsDragging] = useState(false);
    const [localValue, setLocalValue] = useState(0); //time displayed

    //sync local value with engine time  only when NOT dragging
    useEffect(() => {
        if (!isDragging) {
            setLocalValue(rawTime);
        }
    }, [rawTime, isDragging]);

    const handleValueChange = (val: number[]) => {
        console.log(`VALUE: ${val[0]}`)
        setIsDragging(true);
        setLocalValue(val[0]);        
    }

    const handleValueCommit = () => {
        console.log(`VALUE COMMITTED: ${localValue}`)
        audioEngine.seek(localValue);
        setIsDragging(false);
    }

    return (
        <>
        {/* SLIDER */}
        <MiniSlider
            value={[localValue]} 
            max={rawDuration} 
            step={0.1}
            onClick={(e) => e.stopPropagation()}
            onValueChange={handleValueChange}
            onValueCommit={handleValueCommit}
            onPointerUp={handleValueCommit} //fallback for when swipe goes out of bounds
        />
        </>
    );
};
