import { useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion';
import { MusicNoteIcon } from '@phosphor-icons/react';

import { ACTION_CONFIG, SMALL_SWIPE_THRESHOLD_PX, LARGE_SWIPE_THRESHOLD_PX } from './track.constants';
import type { TrackItemProps } from './track.types';


export const TrackItem = ({ 
	track, 
	index = 0,
	actions = ["like", "queue", "delete", "edit"] //default setup
}: TrackItemProps) => {

	/* DRAG ACTION HANDLING */
	const x = useMotionValue(0);

	const justifyAction = useTransform(x, (latest) => (latest > 0 ? "flex-start" : "flex-end")); //which side to justify the icon
	const opacity = useTransform(x, [-50, 0, 50], [1, 0, 1]);
	const actionIndex = useTransform(
		x, 
		[LARGE_SWIPE_THRESHOLD_PX, SMALL_SWIPE_THRESHOLD_PX, -(SMALL_SWIPE_THRESHOLD_PX), -(LARGE_SWIPE_THRESHOLD_PX)],
		[0, 1, 2, 3]
	);

	const [activeIndex, setActiveIndex] = useState<number>(1);

	useMotionValueEvent(actionIndex, "change", (latest) => {
		const rounded = Math.round(latest);
		if (rounded !== activeIndex) {
			setActiveIndex(rounded);
		}
	});

	const actionKey = actions[activeIndex];
	const config = ACTION_CONFIG[actionKey];
	const IconComponent = config.icon;
	const color = config.color;

	const handleDragEnd = (_: any, info: any) => {
		const offset = info.offset.x;

		let msg = "ACTION: ";
		if (Math.abs(offset) >= LARGE_SWIPE_THRESHOLD_PX) {
			msg = `${msg} Large `;
		} else if (Math.abs(offset) >= SMALL_SWIPE_THRESHOLD_PX) {
			msg = `${msg} Small `;
		} else {
			msg = `${msg} None `;
		}

		if (offset > 0) {
			msg = `${msg} Right`;
		} else {
			msg = `${msg} Left`;
		}
		console.log(msg)
	}

	return (
		<>
		<div className="relative group overflow-hidden rounded-lg">

			{/* BACKGROUND ACTIONS LAYER */}
			<motion.div 
				style={{ 
					opacity,
					justifyContent: justifyAction
				}}
				className="absolute inset-0 flex items-center px-6 bg-zinc-800"
			>
				{/* render one icon that changes based on activeIndex. if x > 0 then it is on the left, if x < 0 then on the right */}
				<motion.div 
					key={activeIndex}
					style={{ color }}
				>
					<IconComponent size={20} weight="fill" />
				</motion.div>
			</motion.div>

			{/* DRAG LAYER */}
			<motion.div
				drag="x"
				dragConstraints={{ left: 0, right: 0 }}
				dragSnapToOrigin={true}
				dragElastic={0.4}
				style={{ x }}

				onDragEnd={handleDragEnd}
				className="flex items-center gap-4 py-2 px-3 bg-background rounded-lg active:cursor-grabbing relative z-10 shadow-xl"
			>
				<div className="w-12 h-12 bg-zinc-800 rounded flex items-center justify-center shrink-0">
					<MusicNoteIcon size={20} />
				</div>

				<div className="flex-1 min-w-0 text-left flex flex-col">
					<span className="font-medium text-sm truncate text-white">
						{track.title}
					</span>
					<span className="text-xs text-white/40 truncate">
						{track.artist}
					</span>
				</div>

				{/* Note: Reorder handle is visually here but doesn't have reorder logic yet */}
				<div className="w-5 h-5 text-white/10" />

			</motion.div>
		</div>
		</>
	);
};