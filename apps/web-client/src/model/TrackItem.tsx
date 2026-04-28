import { useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion';

import { MusicNoteIcon } from '@phosphor-icons/react';

import { getTrackDisplayMetadata, useTrackActionHandler } from '@/model/model.utils';
import { useQueue } from '@/store/hooks/useQueue';

import { TRACK_ACTION_CONFIG, SMALL_SWIPE_THRESHOLD_PX, LARGE_SWIPE_THRESHOLD_PX, ICON_SIZE_PX } from '@/model/model.constants';

import type { QueueTrack, TrackAction, TrackItemProps } from '@/model/model.types';
import { audioEngine } from '@/features/audio/audioEngine';


export const TrackItem = ({ 
	track,
	onSelect,
	index = 0,
	actions = ["queueNext", "queueLast", "like", "edit"] //default setup
}: TrackItemProps) => {

	/* DRAG ACTION HANDLING */
	const x = useMotionValue(0);

	const justify = useTransform(x, (latest) => (latest > 0 ? "flex-start" : "flex-end")); //which side to justify the icon
	const opacity = useTransform(x, [SMALL_SWIPE_THRESHOLD_PX, 0, -(SMALL_SWIPE_THRESHOLD_PX)], [1, 0, 1]);

	//get the closest action (for display)
	const [activeIndex, setActiveIndex] = useState<number>(1); //which action to map to
	// useMotionValueEvent(currentIndex, "change", (latest) => {
	useMotionValueEvent(x, "change", (latest) => {
		let newIndex = 1;

		if (latest >= LARGE_SWIPE_THRESHOLD_PX) {
			newIndex = 0; //large right swipe
		} else if (latest >= 0) {
			newIndex = 1; //right
		} else if (latest <= -(LARGE_SWIPE_THRESHOLD_PX)) {
			newIndex = 3; //large left swipe
		} else {
			newIndex = 2;
		}

		if (newIndex !== activeIndex) {
			setActiveIndex(newIndex);
		}
	});
	const actionKey = actions[activeIndex];

	//extract the right Icon and color from the swipe
	const config = TRACK_ACTION_CONFIG[actionKey];
	const IconComponent = config.icon;
	const color = config.color;
	
    //handle the start of a drag and prevent taps from triggering on drags with a flag
    const [isDragging, setIsDragging] = useState(false);
    const handleDragStart = () => {
        setIsDragging(true);
    }

	//actual action execution via model.utils action handler
	const executeAction = useTrackActionHandler();
	const triggerAction = (action: TrackAction) => {
		switch (action) {
			//special field for deleteQueue
			case "deleteQueue": {
				const queueTrack = track as QueueTrack;
				executeAction({
					action,
					queueTrack
				});
				break;
			}

			//fallthrough for all other actions (queueLast, queueNext, like, delete, edit)
			default: {
				executeAction({
					action,
					track
				});
				break;
			}
		}
	};

	//handle the end of the drag. for now just console logs
	const handleDragEnd = () => {

		const offset = x.get(); // visual X offset and not info.offset.x which is highly inflated

		if (Math.abs(offset) >= SMALL_SWIPE_THRESHOLD_PX) {
			triggerAction(actionKey);
		}

		//reset the dragging flag after one frame to prevent taps from triggering
        requestAnimationFrame(() => setIsDragging(false));
    };


	/* TAP ACTION HANDLING */
	const { queue } = useQueue(); //get the latest queue from tanstack

	const currentTrack = queue[0];
	const isActive = currentTrack?.id === track.id;

    const handleTap = async () => {
        if (isDragging) return; //cancel taps on drags

		try {
			//play audio
			audioEngine.playTrack({ trackId: track.id, forceRestart: true });

			//wrapper for actionHandler, see models.utils.ts for implementation
			triggerAction("setFirst");

			onSelect(track);
		} catch (err) {
			console.error("Playback failed to start:", err);
		}
    };

	const { titleDisplay, artistDisplay } = getTrackDisplayMetadata(track); //get metadata for display of this track

	return (
		<>
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
				<div className={`
					w-12 h-12 
					${isActive ? "bg-brand text-white" : "bg-zinc-800 text-white/40"}
					rounded flex items-center justify-center shrink-0
				`}>
					<MusicNoteIcon size={ICON_SIZE_PX} />
				</div>

				<div className="flex-1 min-w-0 text-left flex flex-col">
					<span className="font-medium text-sm truncate text-white">
						{titleDisplay}
					</span>
					<span className="text-xs text-white/40 truncate">
						{artistDisplay}
					</span>
				</div>
			</motion.div>
		</div>
		</>
	);
};