import { useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion';

import { usePlayingTrackId, useSetPlayingTrackId } from '@/store/useLibraryStore';
import { useAudio } from '@/features/audio/AudioProvider';

import { MusicNoteIcon } from '@phosphor-icons/react';

import { TRACK_ACTION_CONFIG, SMALL_SWIPE_THRESHOLD_PX, LARGE_SWIPE_THRESHOLD_PX, ICON_SIZE_PX } from '@/model/model.constants';

import type { TrackItemProps } from '@/model/model.types';
import { makeToast } from '@/features/toast/Toast';


export const TrackItem = ({ 
	track,
	onSelect,
	index = 0,
	actions = ["like", "queue", "delete", "edit"] //default setup
}: TrackItemProps) => {

	/* DRAG ACTION HANDLING */
	const x = useMotionValue(0);

	const justify = useTransform(x, (latest) => (latest > 0 ? "flex-start" : "flex-end")); //which side to justify the icon
	const opacity = useTransform(x, [SMALL_SWIPE_THRESHOLD_PX, 0, -(SMALL_SWIPE_THRESHOLD_PX)], [1, 0, 1]);
	const currentIndex = useTransform(
		x, 
		[LARGE_SWIPE_THRESHOLD_PX, SMALL_SWIPE_THRESHOLD_PX, -(SMALL_SWIPE_THRESHOLD_PX), -(LARGE_SWIPE_THRESHOLD_PX)],
		[0, 1, 2, 3] //current action index
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
	const config = TRACK_ACTION_CONFIG[actionKey];
	const IconComponent = config.icon;
	const color = config.color;

	
    //handle the start of a drag and prevent taps from triggering on drags with a flag
    const [isDragging, setIsDragging] = useState(false);
    const handleDragStart = () => {
        setIsDragging(true);
    }

	//handle the end of the drag. for now just console logs
	const handleDragEnd = (_: any, info: any) => {
		const offset = info.offset.x;

		if (offset >= LARGE_SWIPE_THRESHOLD_PX) {
			console.log("ACTION:", actions[0]);
			makeToast(`ACTION: ${actions[0]}`);
		} else if (offset <= -(LARGE_SWIPE_THRESHOLD_PX)) {
			console.log("ACTION:", actions[3]);
			makeToast(`ACTION: ${actions[3]}`);
		} else if (offset >= SMALL_SWIPE_THRESHOLD_PX) {
			console.log("ACTION:", actions[1]);
			makeToast(`ACTION: ${actions[1]}`);
		} else if (offset <= -(SMALL_SWIPE_THRESHOLD_PX)) {
			console.log("ACTION:", actions[2]);
			makeToast(`ACTION: ${actions[2]}`);
		}

		//reset the dragging flag after one frame to prevent taps from triggering
        requestAnimationFrame(() => setIsDragging(false));
    };


	/* TAP ACTION HANDLING */
	const playingTrackId = usePlayingTrackId();
	const setPlayingTrackId = useSetPlayingTrackId();

	const isActive = playingTrackId === track.id;

    //cancel taps on drags
	const audio = useAudio();
    const handleTap = async () => {
        if (isDragging) return;

		try {
			await audio.playTrack(track.id);
			console.log(`NOW PLAYING: ${track.title}`);
		} catch (err) {
			console.error("Playback failed to start:", err);
		}
		setPlayingTrackId(track.id); //update global store

        onSelect(track);
    };

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
					${isActive ? "bg-purple-500 text-white" : "bg-zinc-800 text-white/40"}
					rounded flex items-center justify-center shrink-0
				`}>
					<MusicNoteIcon size={ICON_SIZE_PX} />
				</div>

				<div className="flex-1 min-w-0 text-left flex flex-col">
					<span className="font-medium text-sm truncate text-white">
						{track.titleDisplay ?? track.title}
					</span>
					<span className="text-xs text-white/40 truncate">
						{track.artists.map(a => a.nameDisplay ?? a.name).join(", ")}
					</span>
				</div>

				{/* Note: Reorder handle is visually here but doesn't have reorder logic yet */}
				<div className="w-5 h-5 text-white/10" />

			</motion.div>
		</div>
		</>
	);
};