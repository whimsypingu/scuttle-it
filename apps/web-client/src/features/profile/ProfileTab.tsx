import { motion } from "framer-motion";

import { User } from "lucide-react";
import { MusicNotesIcon, ClockIcon, HardDrivesIcon } from "@phosphor-icons/react";

import { useStats } from "@/store/hooks/useProfile";

import { CountUp } from "@/components/ui/countup";
import { convertDuration, convertStorage } from "@/features/profile/profile.utils";

import { BOTTOM_SHELF, NAV_CONFIG } from "@/features/player/player.constants";

import type { ProfileTabProps } from "@/features/profile/profile.types";


export const ProfileTab = ({
    tabResetSignal
}: ProfileTabProps) => {

    const { stats } = useStats();

    //extract these values for display
    const trackCountStr = stats.totalTrackCount.toString();

    const { durationLabel, durationStr } = convertDuration(stats.totalListenedDuration);
    const { storageStr, storageSuffix} = convertStorage(stats.totalStorageUsed);

    const displayStats = [
        { label: "Total Tracks", value: trackCountStr, suffix: "", Icon: MusicNotesIcon },
        { label: durationLabel, value: durationStr, suffix: "", Icon: ClockIcon },
        { label: "Audio Storage", value: storageStr, suffix: storageSuffix, Icon: HardDrivesIcon },
    ];

    return (
        <>
        <motion.div 
            className="w-full h-full flex flex-col px-4 overflow-hidden touch-none pt-4"
            style={{ paddingBottom: `${NAV_CONFIG.height}px` }}
        >
            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div
                    className="flex flex-col gap-6" 
                    style={{ marginBottom: `${BOTTOM_SHELF.totalHeight}px` }}
                >
                    {/* HEADER */}
                    <section className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center">
                            <User size={40} />
                        </div> 

                        <div className="flex-1 flex flex-col gap-1">
                            <h1 className="text-2xl">whimsypingu</h1>
                            <p className="text-zinc-400 text-sm">Scuttling since 2026</p>
                        </div>
                    </section>

                    {/* GENERAL STATS */}
                    <section>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {displayStats.map(({ label, value, suffix, Icon }) => (
                                <div 
                                    key={label}
                                    className="flex items-center p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-primary/30 transition-colors"
                                >
                                    <div className="p-3 rounded-lg bg-zinc-800 mr-4">
                                        <Icon size={24} weight="fill" className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                                            {label}
                                        </p>
                                        <p className="text-lg font-mono text-zinc-100">
                                            <CountUp value={value} /> {suffix}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </motion.div>
        </>
    );
};
