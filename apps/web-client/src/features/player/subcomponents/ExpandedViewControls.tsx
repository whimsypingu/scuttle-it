import { motion } from "framer-motion"

import { useEffect, useState } from "react";
import { useQueue } from "@/store/hooks/useQueue";
import { useAudioPlayback, useAudioTime } from "@/features/audio/useAudioEngine";

import { formatTime } from "@/features/audio/audio.utils";
import { audioEngine } from "@/features/audio/audioEngine";

import { FastForwardIcon, PlayIcon, PauseIcon, RepeatIcon, RewindIcon, ShuffleIcon } from '@phosphor-icons/react';
import { Slider } from '@/components/ui/slider';

import { PLAYER_CONFIG } from '@/features/player/player.constants';
import { useSettings } from "@/store/hooks/useSettings";
import { cycleLoopmode } from "@/settings/settings.utils";
import { LOOPMODE_CONFIG } from "@/settings/settings.constants";


//used inside the ExpandedViewControls major subcomponent
const ExpandedViewButtons = () => {
    const { queue, pop } = useQueue(); //get the latest queue from tanstack
    const currentTrack = queue?.[0];
    const nextTrack = queue?.[1];

    const { isPaused } = useAudioPlayback();

    const { settings, setLoopmode } = useSettings();

    const handleRewind = () => {
        if (!currentTrack) {
            console.warn("[ExpandingViewControls] No track in queue to rewind.");
            return;
        }

        console.log(`[ExpandingViewControls] Rewinding track: ${currentTrack.title}`);

        //rewind only if at least 1 second has passed in audio playback
        if (audioEngine.getCurrentTime() >= 1) {
            audioEngine.seek(0);
        }
    }

    const handleSkip = () => {
        if (!currentTrack) {
            console.warn("[ExpandingViewControls] No track in queue to skip.");
            return;
        };

        //plays a next track right away if available (ignores pause status), otherwise reset if no next track
        if (nextTrack) {
            console.log(`[ExpandingViewControls] Skipping track: ${currentTrack.title}`);
            pop(currentTrack);
            audioEngine.playTrack({ trackId: nextTrack.id, forceRestart: true });
        } else {
            console.log("[ExpandingViewControls] Skip but no tracks remaining. Pausing and resetting.");
            audioEngine.pauseTrack();
            audioEngine.seek(0);
        }
    }

    const handleLoopmode = () => {
        const nextLoopmode = cycleLoopmode(settings.loopmode);
        console.log(`[ExpandingViewControls] Setting looping mode: ${nextLoopmode}`)
        setLoopmode(nextLoopmode);
    }

    const config = LOOPMODE_CONFIG[settings.loopmode];
	const IconComponent = config.icon;
	const color = config.color;

    return (
        <>
        {/* BUTTON ROW */}
        <motion.div
            layout
            className={`relative flex flex-row items-center w-full`}
        >
            <button className="p-2 flex-shrink-0">
                <ShuffleIcon size={PLAYER_CONFIG.iconSize} weight="fill" />
            </button>
            
            {/* mighty jank to reduce glitchy look when compact/uncompacting */}
            <motion.div 
                layout 
                layoutId="center-control-group" 
                className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
            >
                {/* REWIND */}
                <button
                    className="p-2 transition-transform active:scale-95"
                    onClick={handleRewind}
                >
                    <RewindIcon size={PLAYER_CONFIG.iconSize} weight="fill" />                    
                </button>

                {/* PLAY/PAUSE */}
                <button
                    className="p-2 transition-transform active:scale-95"
                    onClick={() => audioEngine.playPauseTrack({ trackId: currentTrack?.id })}
                >
                    {isPaused ? (
                        <PlayIcon size={PLAYER_CONFIG.iconSize} weight="fill" />
                    ) : (
                        <PauseIcon size={PLAYER_CONFIG.iconSize} weight="fill" />
                    )}
                </button>

                {/* SKIP */}
                <button
                    className="p-2 transition-transform active:scale-95"
                    onClick={handleSkip}
                >
                    <FastForwardIcon size={PLAYER_CONFIG.iconSize} weight="fill" />
                </button>
            </motion.div>

            <button
                className="p-2 ml-auto flex-shrink-0 transition-transform active:scale-95"
                onClick={handleLoopmode}
                style={{ color }}
            >
                <IconComponent size={PLAYER_CONFIG.iconSize} weight="fill" />
            </button>
        </motion.div>
        </>
    );
};


export const ExpandedViewControls = () => {
    const { time, duration } = useAudioTime();

    //local state for the slider
    const [isDragging, setIsDragging] = useState(false);
    const [localValue, setLocalValue] = useState(0); //time displayed

    //sync local value with engine time  only when NOT dragging
    useEffect(() => {
        if (!isDragging) {
            setLocalValue(time);
        }
    }, [time, isDragging]);

    const handleValueChange = (val: number[]) => { //do this while dragging the slider
        console.debug(`Scrubbing value: ${val[0]}`)
        setIsDragging(true);
        setLocalValue(val[0]);
    }

    const handleValueCommit = () => { //do this when slider is released
        if (!isDragging) return; //prevent double firing
        console.log(`Committing scrubbed value: ${localValue}`)
        audioEngine.seek(localValue);
        setIsDragging(false);
    }

    return (
        <>
        <motion.div
            layout
            layoutId="control-block"
            className={`flex flex-col gap-1 w-full cursor-pointer`}
            onPointerDownCapture={(e) => e.stopPropagation()} /* capture scrubbing */
        >
            {/* SLIDER */}
            <Slider 
                value={[localValue]} 
                max={duration} 
                step={0.1}
                onValueChange={handleValueChange}
                onValueCommit={handleValueCommit}
                onPointerUp={handleValueCommit} //fallback for when swipe goes out of bounds
            />

            {/* DURATION ROW */}
            <motion.div
                layout
                className={`flex flex-row items-center justify-between w-full px-2`}
            >
                <div className="flex-shrink-0">
                    <span className={`text-[10px] font-medium tabular-nums text-white/40`}>
                        {formatTime(localValue)}
                    </span>
                </div>

                <div className="flex-shrink-0">
                    <span className={`text-[10px] font-medium tabular-nums text-white/40`}>
                        {formatTime(duration)}
                    </span>
                </div>
            </motion.div>

            <ExpandedViewButtons />

        </motion.div>
        </>
    );
};
