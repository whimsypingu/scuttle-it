import { useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent, circOut } from 'framer-motion';
import { ChevronDown, Play, ListMusic, GripVertical, Music2 } from 'lucide-react';
import { PlayIcon, PauseIcon, FastForwardIcon, RewindIcon, ShuffleIcon, RepeatIcon  } from '@phosphor-icons/react';

import { PLAYER_CONFIG, NAV_CONFIG } from '@/constants/layout';
import { Slider } from '@/components/ui/slider';

interface GlobalPlayerProps {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
}
export const generateMockQueue = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
        id: `${i+1}`,
        title: `Scuttle Track ${i+1}`,
        artist: String.fromCharCode(65 + (i % 26)),
    }));
};

export const GlobalPlayer = ({ isExpanded, setIsExpanded }: GlobalPlayerProps) => {

    // This function handles the "snap" logic after the user lets go
    const onDragEnd = (_: any, info: any) => {
        const swipeThreshold = 50; // px
        const velocityThreshold = 500; // px/s

        if (isExpanded) {
            // SWIPE DOWN -> close player
            if (info.offset.y > swipeThreshold || info.velocity.y > velocityThreshold) {
                setIsExpanded(false);
            }
        } else {

            // If collapsed, check if swiped up
            if (info.offset.y < -swipeThreshold || info.velocity.y < -velocityThreshold) {
                setIsExpanded(true);
            }
        }
    };

    // scrolling shrinking the size of the album art and moving it around
    const [isCompact, setIsCompact] = useState(false);
    return (
        <>
        <motion.div 
            layout 
            id="global-player-outer-container"
            animate={{
                height: isExpanded ? PLAYER_CONFIG.expandedHeight : `${PLAYER_CONFIG.collapsedHeight}px`,
                bottom: isExpanded ? 0 : `${NAV_CONFIG.height + PLAYER_CONFIG.marginBottom}px`, // Sits above your nav bar
                left: isExpanded ? 0 : `${PLAYER_CONFIG.marginSide}px`,
                right: isExpanded ? 0 : `${PLAYER_CONFIG.marginSide}px`,
                borderRadius: isExpanded ? '0px' : `${PLAYER_CONFIG.borderRadius}px`,
                backgroundColor: isExpanded? 'var(--color-background)' : 'var(--color-brand)',
            }}
            transition={{ 
                type: "spring",
                stiffness: 400,
                damping: 40,
                mass: 1,
            }}
            className="fixed z-50 shadow-2xl overflow-hidden cursor-pointer"
            onClick={() => !isExpanded && setIsExpanded(true)}
            drag={"y"} // enable vertical dragging
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.05}
            onDragEnd={onDragEnd}
        >

            {isExpanded ? (
                <motion.div layout layoutId="global-player-inner-container" className="relative flex flex-col h-full px-8 pt-8">

                <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}>
                    <ChevronDown className="w-8 h-8" />
                </button>
                
                {/* THE HEADER: This stays at the top */}
                <motion.div 
                    layout
                    className={`top-0 z-20 py-8 ${isCompact ? "px-2" : "px-0 h-full"} w-full`}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 40,
                        mass: 1,
                    }}
                >
                    <motion.div
                        layout
                        layoutId="compact-stuff"
                        className={`flex flex-col ${isCompact ? "gap-4" : "gap-8"} items-center justify-center w-full`}
                    >
                        <motion.div 
                            layout
                            layoutId="album-art-text-block"
                            className={`flex ${isCompact ? "flex-row items-center gap-4" : "flex-col gap-4 items-center justify-center"} w-full`}
                        >
                            {/* ALBUM ART */}
                            <motion.div
                                layout
                                layoutId="album-art"
                                className={`bg-brand shadow-2xl flex-shrink-0 ${isCompact ? "w-12 h-12 rounded" : "w-48 h-48 rounded-2xl"}`}
                                onClick={() => setIsCompact(!isCompact)}
                            />

                            {/* TEXT BLOCK */}
                            <motion.div
                                layout="position"
                                layoutId="text-block"
                                className={`flex flex-col flex-1 min-w-0 w-full ${isCompact ? "items-start" : "items-center"} text-left justify-center overflow-hidden`} 
                            >
                                <motion.span 
                                    layout="position"
                                    className="text-lg font-medium truncate leading-tight max-w-full block"
                                >
                                    Scuttle Rebuild grrrrrrrrrrrrrrrrrrrrrrrrrrr
                                </motion.span>
                                
                                <motion.span 
                                    layout="position"
                                    className="text-white/60 text-sm font-light truncate max-w-full block"
                                >
                                    The New Professional
                                </motion.span>
                            </motion.div> 

                        </motion.div>

                        {/* CONTROL BLOCK */}
                        <motion.div
                            layout
                            layoutId="control-block"
                            className={`flex flex-col gap-1 w-full`}
                            onPointerDownCapture={(e) => e.stopPropagation()} /* capture scrubbing */
                        >
                            <Slider 
                                defaultValue={[0]} max={100} step={1}
                            />

                            {/* DURATION ROW */}
                            <div
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
                            </div>

                            {/* BUTTON ROW */}
                            <div
                                className={`flex flex-row items-center justify-between w-full px-2`}
                            >
                                <div className="flex-shrink-0">
                                    <ShuffleIcon size={20} weight="fill" />
                                </div>

                                <div className={`flex-1 min-w-0 flex flex-row items-center justify-center min-w-0 gap-4`}>
                                    <RewindIcon size={20} weight="fill" />
                                    <PlayIcon size={20} weight="fill" />
                                    <FastForwardIcon size={20} weight="fill" />
                                </div>

                                <div className="flex-shrink-0">
                                    <RepeatIcon size={20} weight="fill" />
                                </div>
                            </div>
                        </motion.div>

                    </motion.div>
                </motion.div>

                {isCompact ? (
                    <>
                    {/* SCROLL AREA */}
                    <motion.div
                        key="queue-area"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }} // Slight delay so the container expands first
                        className="flex-1 overflow-y-auto px-2 custom-scrollbar h-full"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <div className="space-y-2 py-8">
                            {generateMockQueue(100).map((track) => (
                            <div 
                                key={track.id} 
                                className="flex items-center gap-4 py-2 rounded-lg hover:bg-white/5 group transition-colors"
                            >
                                <div className="w-12 h-12 bg-zinc-800 rounded flex items-center justify-center shrink-0">
                                <Music2 className="w-5 h-5 text-white/20" />
                                </div>
                                <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{track.title}</div>
                                <div className="text-xs text-white/40 truncate">{track.artist}</div>
                                </div>
                                <GripVertical className="w-5 h-5 text-white/10 group-active:text-white/40 cursor-grab" />
                            </div>
                            ))}
                        </div>
                    </motion.div>
                    </>
                ) : null}
                
                </motion.div>
            ) : (
                <motion.div layout layoutId="global-player-inner-container" className="flex items-center justify-between h-full px-3">
                    <div className="flex items-center gap-3">
                        <motion.div layout layoutId="album-art" className="w-10 h-10 bg-black/20 rounded" />

                        {/* TEXT BLOCK */}
                        <motion.div
                            layout="position"
                            layoutId="text-block"
                            className={`flex flex-col flex-1 min-w-0 w-full text-left items-center justify-between`} 
                        >
                            <motion.span 
                                layout="position"
                                className="text-sn font-bold truncate leading-tight w-full"
                            >
                                Scuttle Rebuild
                            </motion.span>
                            
                            <motion.span 
                                layout="position"
                                className="text-white/60 text-xs truncate w-full"
                            >
                                The New Professional
                            </motion.span>
                        </motion.div> 
                    </div>
            
                    <Play className="w-6 h-6 fill-current" />
                </motion.div>
            )}
        </motion.div>

        </>
    );

    const x = (
        <>
        <motion.div
            layout // The magic prop that handles smooth resizing
            initial={false}
            animate={{
                height: isExpanded ? PLAYER_CONFIG.expandedHeight : `${PLAYER_CONFIG.collapsedHeight}px`,
                bottom: isExpanded ? 0 : `${NAV_CONFIG.height + PLAYER_CONFIG.marginBottom}px`, // Sits above your nav bar
                left: isExpanded ? 0 : `${PLAYER_CONFIG.marginSide}px`,
                right: isExpanded ? 0 : `${PLAYER_CONFIG.marginSide}px`,
                borderRadius: isExpanded ? '0px' : `${PLAYER_CONFIG.borderRadius}px`,
                backgroundColor: isExpanded? 'var(--color-background)' : 'var(--color-brand)',
            }}
            transition={{ 
                type: 'spring', 
                visualDuration: 0.2,
                bounce: 0.1,
            }}
            className="fixed z-50 shadow-2xl overflow-hidden cursor-pointer"
            onClick={() => !isExpanded && setIsExpanded(true)}
            drag={"y"} // enable vertical dragging
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.05}
            onDragEnd={onDragEnd}
        >
        {/* We use AnimatePresence to swap the "Mini" and "Full" content 
            inside the same moving container.
        */}
        <AnimatePresence mode="wait">
            {isExpanded ? (
                <motion.div
                    key="full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative flex flex-col h-full px-8 pt-8"
                >
                    <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}>
                        <ChevronDown className="w-8 h-8" />
                    </button>
                    
                    
                    {/* THE HEADER: This stays at the top */}
                    <motion.div 
                        layout
                        className={`top-0 z-20 bg-background py-8 ${isCompact ? "px-2" : "px-0 h-full"} w-full`}
                        transition={{
                            type: "spring",
                            visualDuration: 0.3,
                            bounce: 0.1
                        }}
                    >
                        <motion.div
                            layout
                            layoutId="compact-stuff"
                            className={`flex flex-col ${isCompact ? "gap-4" : "gap-8"} items-center justify-center w-full`}
                        >
                            <motion.div 
                                layout
                                layoutId="album-art-text-block"
                                className={`flex ${isCompact ? "flex-row items-center gap-4" : "flex-col gap-4 items-center justify-center"} w-full`}
                            >
                                {/* ALBUM ART */}
                                <motion.div
                                    layout
                                    layoutId="album-art"
                                    className={`bg-brand shadow-2xl flex-shrink-0 ${isCompact ? "w-12 h-12 rounded" : "w-48 h-48 rounded-2xl"}`}
                                    onClick={() => setIsCompact(!isCompact)}
                                />

                                {/* TEXT BLOCK */}
                                <motion.div
                                    layout
                                    layoutId="text-block"
                                    className={`flex flex-col flex-1 min-w-0 w-full ${isCompact ? "text-left" : "text-center"} items-center justify-between`} 
                                >
                                    <motion.h2 layout className="text-xl font-bold truncate leading-tight w-full">Scuttle Rebuild</motion.h2>
                                    <motion.p layout className="text-white/60 text-sm truncate w-full">The New Professional</motion.p>
                                </motion.div> 

                            </motion.div>

                            {/* CONTROL BLOCK */}
                            <motion.div
                                layout
                                layoutId="control-block"
                                className={`flex flex-col gap-1 w-full`}
                                onPointerDownCapture={(e) => e.stopPropagation()} /* capture scrubbing */
                            >
                                <Slider 
                                    defaultValue={[0]} max={100} step={1}
                                />

                                {/* DURATION ROW */}
                                <div
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
                                </div>

                                {/* BUTTON ROW */}
                                <div
                                    className={`flex flex-row items-center justify-between w-full px-2`}
                                >
                                    <div className="flex-shrink-0">
                                        <ShuffleIcon size={20} weight="fill" />
                                    </div>

                                    <div className={`flex-1 min-w-0 flex flex-row items-center justify-center min-w-0 gap-4`}>
                                        <RewindIcon size={20} weight="fill" />
                                        <PlayIcon size={20} weight="fill" />
                                        <FastForwardIcon size={20} weight="fill" />
                                    </div>

                                    <div className="flex-shrink-0">
                                        <RepeatIcon size={20} weight="fill" />
                                    </div>
                                </div>
                            </motion.div>

                        </motion.div>
                    </motion.div>

                    {/* SCROLL AREA */}
                    <div
                        className="flex-1 overflow-y-auto px-2 custom-scrollbar bg-background h-full"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <div className="space-y-2 py-8">
                            {generateMockQueue(100).map((track) => (
                            <div 
                                key={track.id} 
                                className="flex items-center gap-4 py-2 rounded-lg hover:bg-white/5 group transition-colors"
                            >
                                <div className="w-12 h-12 bg-zinc-800 rounded flex items-center justify-center shrink-0">
                                <Music2 className="w-5 h-5 text-white/20" />
                                </div>
                                <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{track.title}</div>
                                <div className="text-xs text-white/40 truncate">{track.artist}</div>
                                </div>
                                <GripVertical className="w-5 h-5 text-white/10 group-active:text-white/40 cursor-grab" />
                            </div>
                            ))}
                        </div>

                    </div>

                </motion.div>
            ) : (
                <motion.div
                    key="mini"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between h-full px-3"
                >
                    <div className="flex items-center gap-3">
                    <motion.div layoutId="album-art" className="w-10 h-10 bg-black/20 rounded" />
                    <div className="text-sm font-bold">Scuttle Rebuild</div>
                    </div>
                    <Play className="w-6 h-6 fill-current" />
                </motion.div>
            )}
        </AnimatePresence>
        </motion.div>
        </>
    );
};