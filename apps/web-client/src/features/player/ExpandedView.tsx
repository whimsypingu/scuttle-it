import { motion } from 'framer-motion';

import { CaretDownIcon, FastForwardIcon, PlayIcon, RepeatIcon, RewindIcon, ShuffleIcon } from '@phosphor-icons/react';
import { Slider } from '@/components/ui/slider';

import { QueueView } from '@/features/queue/QueueView';

import { PLAYER_CONFIG } from '@/features/player/player.constants';

import type { ExpandedViewProps } from '@/features/player/player.types';


//consider not propagating isCompact down to here and just start it here
export const ExpandedView = ({ isCompact, setIsCompact, onClose, playerDragControls }: ExpandedViewProps) => {
    return (
        <>
        <motion.div
            layout
            layoutId="global-player-inner-container"
            className="relative flex flex-col h-full px-8 pt-8"
        >
            {/* CLOSE BUTTON */}
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            >
                <CaretDownIcon size={PLAYER_CONFIG.iconSize} weight="regular" />
            </button>

            {/* HEADER: Transitions between compact (which includes queue) and current track view */}
            <motion.div
                layout
                className={`top-0 z-20 py-8 ${isCompact ? "px-5" : "px-2 h-full"} w-full`} //should i do px-5 or px-2 for isCompact?
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 40,
                    mass: 1,
                }}
            >
                <motion.div
                    layout
                    layoutId="album-art-text-block-control-block"
                    className={`flex flex-col ${isCompact ? "gap-4" : "gap-8"} items-center justify-center w-full`}
                >
                    {/* ALBUM ART + TEXT BLOCK */}
                    <motion.div 
                        layout
                        layoutId="album-art-text-block"
                        className={`flex ${isCompact ? "flex-row items-center gap-4" : "flex-col gap-4 items-center justify-center"} w-full`}
                    >
                        {/* SHARED: ALBUM ART */}
                        <motion.div
                            layout
                            layoutId="album-art"
                            className={`bg-brand shadow-2xl flex-shrink-0 ${isCompact ? "w-12 h-12 rounded" : "w-48 h-48 rounded-2xl"}`}
                            onClick={() => setIsCompact(!isCompact)}
                        />

                        {/* SHARED: TEXT BLOCK */}
                        <motion.div
                            layout="position"
                            layoutId="text-block"
                            className={`flex flex-col flex-1 min-w-0 w-full ${isCompact ? "items-start" : "items-center"} text-left justify-center overflow-hidden`} 
                        >
                            <motion.span 
                                layout="position"
                                className="text-lg font-medium truncate leading-tight max-w-full block"
                            >
                                Scuttle Rebuild GRRRRRRRRRRRRRRRRRRRRR
                            </motion.span>
                            
                            <motion.span 
                                layout="position"
                                className="text-white/60 text-sm font-light truncate max-w-full block"
                            >
                                Track Artist
                            </motion.span>
                        </motion.div> 

                    </motion.div>

                    {/* CONTROLS */}
                    <motion.div
                        layout
                        layoutId="control-block"
                        className={`flex flex-col gap-1 w-full`}
                        onPointerDownCapture={(e) => e.stopPropagation()} /* capture scrubbing */
                    >
                        {/* SLIDER */}
                        <Slider 
                            defaultValue={[0]} max={100} step={1}
                        />

                        {/* DURATION ROW */}
                        <motion.div
                            layout
                            className={`flex flex-row items-center justify-between w-full px-2`}
                        >
                            <div className="flex-shrink-0">
                                <span className={`text-[10px] font-medium tabular-nums text-white/40`}>
                                    1:23
                                </span>
                            </div>

                            <div className="flex-shrink-0">
                                <span className={`text-[10px] font-medium tabular-nums text-white/40`}>
                                    4:56
                                </span>
                            </div>
                        </motion.div>

                        {/* BUTTON ROW */}
                        <motion.div
                            layout
                            className={`relative flex flex-row items-center w-full px-2`}
                        >
                            <div className="flex-shrink-0">
                                <ShuffleIcon size={PLAYER_CONFIG.iconSize} weight="fill" />
                            </div>
                            
                            {/* mighty jank to reduce glitchy look when compact/uncompacting */}
                            <motion.div 
                                layout 
                                layoutId="center-control-group" 
                                className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-4"
                            >
                                <RewindIcon size={PLAYER_CONFIG.iconSize} weight="fill" />
                                <PlayIcon size={PLAYER_CONFIG.iconSize} weight="fill" />
                                <FastForwardIcon size={PLAYER_CONFIG.iconSize} weight="fill" />
                            </motion.div>

                            <div className="ml-auto flex-shrink-0">
                                <RepeatIcon size={PLAYER_CONFIG.iconSize} weight="fill" />
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* QUEUE AREA: Only visible in compact mode */}
            {isCompact && (
                <>
                {/* SCROLL AREA */}
                <motion.div
                    key="queue-area"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }} // Slight delay so the container expands first
                    // className="flex-1 overflow-y-auto px-2 custom-scrollbar h-full"
                    className="flex-1 overflow-hidden px-2 h-full"
                    onPointerDown={() => playerDragControls.cancel()}
                >
                    <QueueView />
                </motion.div>
                </>
            )}
        </motion.div>
        </>
    );
};
