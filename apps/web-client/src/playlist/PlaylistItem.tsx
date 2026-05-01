import { useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion';

import { MusicNoteIcon } from '@phosphor-icons/react';

import { PLAYLIST_ACTION_CONFIG, SMALL_SWIPE_THRESHOLD_PX, ICON_SIZE_PX } from '@/playlist/playlist.constants';

import type { PlaylistItemProps } from '@/playlist/playlist.types';


export const PlaylistItem = ({ 
    playlist,
    onSelect,
    actions = ["pin", "delete"] //default setup
}: PlaylistItemProps) => {

    /* DRAG ACTION HANDLING */
    const x = useMotionValue(0);

    const justify = useTransform(x, (latest) => (latest > 0 ? "flex-start" : "flex-end")); //which side to justify the icon
    const opacity = useTransform(x, [SMALL_SWIPE_THRESHOLD_PX, 0, -(SMALL_SWIPE_THRESHOLD_PX)], [1, 0, 1]);
    const currentIndex = useTransform(
        x, 
        [SMALL_SWIPE_THRESHOLD_PX, -(SMALL_SWIPE_THRESHOLD_PX)],
        [0, 1] //current action index
    );

    //get the closest action
    const [activeIndex, setActiveIndex] = useState<number>(1); //which action to map to
    useMotionValueEvent(currentIndex, "change", (latest) => {
        const rounded = Math.round(latest);
        if (rounded !== activeIndex) {
            setActiveIndex(rounded);
        }
    });
    const actionKey = actions[activeIndex];

    //extract the right Icon and color from the swipe
    const config = PLAYLIST_ACTION_CONFIG[actionKey];
    const IconComponent = config.icon;
    const color = config.color;

    //handle the start of a drag and prevent taps from triggering on drags with a flag
    const [isDragging, setIsDragging] = useState(false);
    const handleDragStart = () => {
        setIsDragging(true);
    }

    //handle the end of the drag. for now just console logs
    const handleDragEnd = (_: any, info: any) => {
        const offsetX = info.offset.x;
        const offsetY = info.offset.y;

        if (Math.abs(offsetX) < 5 && Math.abs(offsetY) < 5) {
            onSelect(playlist);
            console.log("TAP");
            return;
        }

        let msg = "ACTION: ";
        if (Math.abs(offsetX) >= SMALL_SWIPE_THRESHOLD_PX) {
            msg = `${msg} Small `;
        } else {
            msg = `${msg} None `;
        }

        if (offsetX > 0) {
            msg = `${msg} Right`;
        } else {
            msg = `${msg} Left`;
        }
        console.log(msg)

        //reset the dragging flag after one frame to prevent taps from triggering
        requestAnimationFrame(() => setIsDragging(false));
    };

    //cancel taps on drags
    const handleTap = () => {
        if (isDragging) return;

        onSelect(playlist);
    };

    return (
        <>
        {/* className="flex items-center gap-4 p-2 rounded-xl bg-zinc-900/50 active:bg-zinc-800 transition-colors cursor-pointer group" */}
        <div className="relative group overflow-hidden rounded-lg">

            {/* BACKGROUND ACTIONS LAYER */}
            <motion.div 
                style={{ 
                    opacity,
                    justifyContent: justify
                }}
                className="absolute inset-0 flex items-center px-6 bg-zinc-800"
            >
                {/* render one icon that changes based on activeIndex. if x > 0 then it is on the left, if x < 0 then on the right */}
                <motion.div 
                    key={activeIndex}
                    style={{ color }}
                >
                    <IconComponent size={ICON_SIZE_PX} weight="fill" />
                </motion.div>
            </motion.div>

            {/* DRAG LAYER */}
            <motion.div
                drag="x"
                dragDirectionLock
                dragConstraints={{ left: 0, right: 0 }}
                dragSnapToOrigin={true}
                dragElastic={0.4}
                style={{ x }}

                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onTap={handleTap}
                
				whileTap={!isDragging ? { scale: 0.98 } : {}}
				transition={{ type: "spring", stiffness: 400, damping: 30 }}

                className="flex items-center gap-4 py-2 px-3 bg-background rounded-lg active:cursor-grabbing relative z-10 shadow-xl"
            >
                <div 
                    className="w-12 h-12 rounded flex items-center justify-center shrink-0"
                    style={{ backgroundColor: playlist.color }}
                >
                    <MusicNoteIcon size={ICON_SIZE_PX} />
                </div>

                <div className="flex-1 min-w-0 text-left flex flex-col">
                    <span className="font-medium text-sm truncate text-white">
                        {playlist.name}
                    </span>
                    <span className="text-[10px] text-white/40 truncate uppercase tracking-wider">
                        {playlist.trackCount} tracks
                    </span>
                </div>
            </motion.div>
        </div>
        </>
    );
};