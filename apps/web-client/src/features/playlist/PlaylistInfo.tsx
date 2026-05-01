import { PlayIcon, QuestionIcon, ShuffleIcon } from '@phosphor-icons/react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { formatReadableTime } from '@/features/audio/audio.utils';

import { SORTMODE_CONFIG } from '@/store/hooks/hooks.constants';
import { PLAYLIST_CONFIG } from '@/features/playlist/playlist.constants';

import type { PlaylistInfoProps } from '@/features/playlist/playlist.types';
import type { Sortmode } from '@/store/hooks/hooks.types';


export const PlaylistInfo = ({
    scrollContext
}: PlaylistInfoProps) => {
    const { 
        totalCount,
        totalDuration, 
        sortmode, 
        setSortmode 
    } = scrollContext;

    const isSortable = (typeof sortmode === "number") && !!setSortmode; //check specifically for existence, not truthiness for sortmode because 0 is falsy
    const CurrentIcon = isSortable ? SORTMODE_CONFIG[sortmode].icon : QuestionIcon; //precompute current Icon if available, otherwise see a QuestionIcon which should never happen

    return (
        <div className="flex gap-4">
            <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-zinc-600 uppercase font-medium">Tracks</span>
                <span className="text-xs text-white/70">
                    {totalCount}
                </span>
            </div>

            <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-zinc-600 uppercase font-medium">Duration</span>
                <span className="text-xs text-white/70">
                    {formatReadableTime(totalDuration)}
                </span>
            </div>

            {/* RIGHT ACTION GROUP */}
            <div className="ml-auto flex items-end gap-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all">
                {/* PLAY ALL */}
                <button className="p-1">
                    <PlayIcon size={PLAYLIST_CONFIG.iconSize} weight="fill" />
                </button>
                
                {/* SHUFFLE */}
                <button className="p-1">
                    <ShuffleIcon size={PLAYLIST_CONFIG.iconSize} weight="bold" />
                </button>

                {/* SORT TRIGGER */}
                {isSortable && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1">
                                <CurrentIcon size={PLAYLIST_CONFIG.iconSize} weight="bold" />
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent>
                            <DropdownMenuRadioGroup
                                value={sortmode.toString()}
                                onValueChange={(value) => setSortmode(parseInt(value) as Sortmode)}
                            >
                                {Object.entries(SORTMODE_CONFIG).map(([sortmodeKey, config]) => {
                                    const Icon = config.icon;

                                    return (
                                        <DropdownMenuRadioItem
                                            value={sortmodeKey}
                                            className="text-[11px] uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 rounded-full cursor-pointer"
                                        >
                                            <Icon size={PLAYLIST_CONFIG.dropdownIconSize} />
                                            {config.detail}
                                        </DropdownMenuRadioItem>
                                    )
                                })}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
            
        </div>
    )
}
