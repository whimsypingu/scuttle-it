import { useEffect, useState } from "react";
import { useAudioPlayback, useAudioTime } from "@/features/audio/useAudioEngine";
import { useQueue } from "@/store/hooks/useQueue";
import { usePlayerState } from "@/features/player/PlayerStateProvider";

import { PlayIcon, PauseIcon, WaveformIcon } from "@phosphor-icons/react";

import { MiniShimmer, MiniSlider } from "@/components/ui/mini-slider";

import { audioEngine } from "@/features/audio/audioEngine";

import { PLAYER_CONFIG } from "@/features/player/player.constants";


export const MiniViewPlayPauseButton = () => {
    const { queue } = useQueue(); //get the latest queue from tanstack
    const currentTrack = queue?.[0];

    const { isPaused } = useAudioPlayback();

    return (
        <>
        {/* PLAY/PAUSE */}
        <button
            className="p-2 transition-transform active:scale-95"
            onClick={(e) => {
                e.stopPropagation();
                audioEngine.playPauseTrack({ trackId: currentTrack?.id });
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

export const MiniViewListenModeButton = () => {
    return (
        <>
        {/* LISTENING MODE */}
        <button
            className="p-2 transition-transform active:scale-95"
            onClick={(e) => {}}
        >
            <WaveformIcon size={PLAYER_CONFIG.iconSize} />
        </button>
        </>
    );
}


export const MiniViewSlider = () => {
    const { time, duration } = useAudioTime();

    //local state for the slider
    const { isScrubbing, setIsScrubbing } = usePlayerState();
    const [localValue, setLocalValue] = useState(0); //time displayed

    //sync local value with engine time  only when NOT dragging
    useEffect(() => {
        if (!isScrubbing) {
            setLocalValue(time);
        }
    }, [time, isScrubbing]);

    const handleValueChange = (val: number[]) => { //do this while dragging the slider
        console.debug(`Scrubbing value: ${val[0]}`)
        setIsScrubbing(true);
        setLocalValue(val[0]);        
    }

    const handleValueCommit = () => { //do this when slider is released
        if (!isScrubbing) return; //prevent double firing
        console.log(`Committing scrubbed value: ${localValue}`)
        audioEngine.seek(localValue);
        setIsScrubbing(false);
    }

    return (
        <>
        {/* SLIDER */}
        <MiniSlider
            value={[localValue]} 
            max={duration} 
            step={0.1}
            onClick={(e) => e.stopPropagation()}
            onValueChange={handleValueChange}
            onValueCommit={handleValueCommit}
            onPointerUp={handleValueCommit} //fallback for when swipe goes out of bounds
        />
        </>
    );
};


export const MiniViewShimmer = () => {
    return (
        <>
        {/* SHIMMER SWEEP */}
        <MiniShimmer />
        </>
    );
};
