import { useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent, circOut } from 'framer-motion';
import { ChevronDown, Play, SkipBack, SkipForward, ListMusic, GripVertical, Music2 } from 'lucide-react';

import { PLAYER_CONFIG, NAV_CONFIG } from '@/constants/layout';

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

    const [showQueue, setShowQueue] = useState(false);

    // This function handles the "snap" logic after the user lets go
    const onDragEnd = (_: any, info: any) => {
        const swipeThreshold = 50; // px
        const velocityThreshold = 500; // px/s

        if (isExpanded) {
            // SWIPE DOWN -> close player
            if (info.offset.y > swipeThreshold || info.velocity.y > velocityThreshold) {

                if (!showQueue) {
                    setIsExpanded(false);
                }
                setShowQueue(false);
            }
            // SWIPE UP -> open queue, only if not already open
            else if (info.offset.y < -swipeThreshold || info.velocity.y < -velocityThreshold) {

                if (!showQueue) {
                    setShowQueue(true);
                }
            }
        } else {

            // If collapsed, check if swiped up
            if (info.offset.y < -swipeThreshold || info.velocity.y < -velocityThreshold) {
                setIsExpanded(true);
            }
        }
    };

    // scrolling shrinking the size of the album art and moving it around
    const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
    const { scrollYProgress, scrollY } = useScroll({ 
        container: scrollEl ? { current: scrollEl } : undefined
    });

    const [isCompact, setIsCompact] = useState(false);

    const LIMIT = 50;
    useMotionValueEvent(scrollY, "change", (latest) => {
        console.log("Framer ScrollY:", latest);
        if (latest > LIMIT && !isCompact) {
            console.log("SET TO TRUE");
            setIsCompact(true);
        }
        if (latest <= LIMIT && isCompact) {
            console.log("SET TO FALSE");
            setIsCompact(false);
        }
    });
    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        console.log("Framer ScrollYProgress:", latest);
    });

    return (
        <motion.div
            layout // The magic prop that handles smooth resizing
            initial={false}
            animate={{
                height: isExpanded ? PLAYER_CONFIG.expandedHeight : `${PLAYER_CONFIG.collapsedHeight}px`,
                bottom: isExpanded ? 0 : `${NAV_CONFIG.height + PLAYER_CONFIG.marginBottom}px`, // Sits above your nav bar
                left: isExpanded ? 0 : `${PLAYER_CONFIG.marginSide}px`,
                right: isExpanded ? 0 : `${PLAYER_CONFIG.marginSide}px`,
                borderRadius: isExpanded ? '0px' : `${PLAYER_CONFIG.borderRadius}px`,
                backgroundColor: isExpanded? 'var(--color-surface)' : 'var(--color-brand)',
            }}
            transition={{ 
                type: 'spring', 
                stiffness: 400, 
                damping: 30,
                mass: 0.8, 
            }}
            className="fixed z-50 shadow-2xl overflow-hidden cursor-pointer"
            onClick={() => !isExpanded && setIsExpanded(true)}
            drag="y" // enable vertical dragging
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
                    className="relative flex flex-col h-full p-8"
                >
                    <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}>
                        <ChevronDown className="w-8 h-8 mb-8" />
                    </button>
                    
                    
                    {/* THE HEADER: This stays at the top */}
                    <motion.div 
                        layout
                        className="top-0 w-full z-20 bg-surface p-8"
                        transition={{
                            type: "spring",
                            visualDuration: 0.3,
                            bounce: 0.1
                        }}
                    >
                        <motion.div 
                            layout
                            className={`flex ${isCompact ? "flex-row items-center gap-4" : "flex-col gap-4 items-center justify-center"} w-full`}
                        >

                            {/* ALBUM ART */}
                            <motion.div
                                layout
                                layoutId="album-art"
                                style={{
                                    width: isCompact ? "48px" : "192px",
                                    height: isCompact ? "48px" : "192px",
                                    borderRadius: isCompact ? "rounded" : "rounded-xl",
                                }}
                                className="bg-brand shadow-2xl flex-shrink-0"
                            />

                            {/* TEXT BLOCK */}
                            <motion.div
                                layout
                                className={`flex flex-col ${isCompact ? "text-left" : "text-center"} justify-between`}
                            >
                                <motion.h2 layout className="text-xl font-bold truncate">Scuttle Rebuild</motion.h2>
                                <motion.p layout className="text-white/60 text-sm">The New Professional</motion.p>
                            </motion.div> 

                        </motion.div>
                    </motion.div>

                    {/* SCROLL AREA */}
                    <div
                        ref={(el) => setScrollEl(el)}
                        className="flex-1 overflow-y-auto px-8 custom-scrollbar bg-surface h-full"
                        onPointerDown={(e) => e.stopPropagation()}
                    >


                        <div className="space-y-2 py-8">
                            {generateMockQueue(100).map((track) => (
                            <div 
                                key={track.id} 
                                className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/5 group transition-colors"
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

                    {/* <div 
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto px-8 custom-scrollbar"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 z-20 bg-surface pb-6">

                            
                            <motion.div
                                className="relative flex flex-col items-center"
                            >

                            </motion.div>
                        </div>

                        <div className="pt-6 pb-20">
                            <QueueView /> 
                        </div>
                    </div>
 */}
                    {/* <div className="flex-1 relative">
                        <AnimatePresence initial={false} mode="popLayout">
                            {showQueue ? (
                                <motion.div 
                                    key="queue"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2, ease: "circOut" }}
                                    className="absolute inset-0"
                                >
                                    <QueueView />
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="now-playing"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute inset-0"
                                >
                                    <NowPlayingView key="now-playing" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div> */}
                    
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
    );
};