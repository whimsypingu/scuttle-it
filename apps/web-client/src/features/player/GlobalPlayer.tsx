import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Play, SkipBack, SkipForward, ListMusic } from 'lucide-react';

import { PLAYER_CONFIG, NAV_CONFIG } from '@/constants/layout';
import { QueueView } from '@/features/queue/QueueView';
import { NowPlayingView } from '@/features/player/NowPlayingView';

interface GlobalPlayerProps {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
}

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
                    className="flex flex-col h-full p-8"
                >
                    <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}>
                    <ChevronDown className="w-8 h-8 mb-8" />
                    </button>
                    
                    <div className="flex-1 relative">
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
    );
};