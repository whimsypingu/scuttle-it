import { motion } from "framer-motion"

import { FastForwardIcon, PlayIcon, PauseIcon, RepeatIcon, RewindIcon, ShuffleIcon } from '@phosphor-icons/react';
import { Slider } from '@/components/ui/slider';

import { PLAYER_CONFIG } from '@/features/player/player.constants';

import { useAudioEngine } from "@/features/audio/useAudioEngine";
import { formatTime } from "@/features/audio/audio.utils";
import { useEffect, useState } from "react";
import { audioEngine } from "@/features/audio/audioEngine";
import { useQueue } from "@/store/hooks/useQueue";


//used inside the ExpandedViewControls major subcomponent
const ExpandedViewPlayPauseButton = () => {
    const { queue } = useQueue(); //get the latest queue from tanstack
    const currentTrack = queue?.[0];

    const { isPaused } = useAudioEngine();

    return (
        <>
        {/* PLAY/PAUSE */}
        <button
            className="p-2 transition-transform active:scale-95"
            onClick={() => audioEngine.playPauseTrack(currentTrack?.id)}
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


export const ExpandedViewControls = () => {
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
        if (!isDragging) return; //prevent double firing
        console.log(`VALUE COMMITTED: ${localValue}`)
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
                max={rawDuration} 
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
                        {formatTime(rawDuration)}
                    </span>
                </div>
            </motion.div>

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
                        onClick={() => null}
                    >
                        <RewindIcon size={PLAYER_CONFIG.iconSize} weight="fill" />                    
                    </button>

                    <ExpandedViewPlayPauseButton />

                    {/* SKIP */}
                    <button
                        className="p-2 transition-transform active:scale-95"
                        onClick={() => null}
                    >
                        <FastForwardIcon size={PLAYER_CONFIG.iconSize} weight="fill" />
                    </button>
                </motion.div>

                <button className="p-2 ml-auto flex-shrink-0">
                    <RepeatIcon size={PLAYER_CONFIG.iconSize} weight="fill" />
                </button>
            </motion.div>
        </motion.div>
        </>
    );
};
