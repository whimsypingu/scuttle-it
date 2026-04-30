import type { PlaylistInfoProps } from '@/features/playlist/playlist.types';
import { PlayIcon, ShuffleIcon, SortAscendingIcon } from '@phosphor-icons/react';
import { PLAYER_CONFIG } from '../player/player.constants';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Sortmode } from '@/store/hooks/hooks.types';


export const PlaylistInfo = ({
    scrollContext
}: PlaylistInfoProps) => {
    const { 
        totalCount, 
        sortmode, 
        setSortmode 
    } = scrollContext;

    const isSortable = (typeof sortmode === "number") && !!setSortmode; //check specifically for existence, not truthiness for sortmode because 0 is falsy

    return (
        <div className="flex gap-4">
            <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider">Tracks</span>
                <span className="text-xs text-white/70">
                    {totalCount}
                </span>
            </div>

            <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-zinc-600 uppercase font-medium">Duration</span>
                <span className="text-xs text-white/70">N/A</span>
            </div>

            {/* RIGHT ACTION GROUP */}
            <div className="ml-auto flex items-end gap-2">
                {/* PLAY ALL */}
                <button className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all">
                    <PlayIcon size={PLAYER_CONFIG.iconSize} weight="fill" />
                </button>
                
                {/* SHUFFLE */}
                <button className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all">
                    <ShuffleIcon size={PLAYER_CONFIG.iconSize} weight="bold" />
                </button>

                {/* SORT TRIGGER */}
                {isSortable && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all">
                                <SortAscendingIcon size={PLAYER_CONFIG.iconSize} weight="bold" />
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent>
                            <DropdownMenuRadioGroup
                                value={sortmode.toString()}
                                onValueChange={(value) => setSortmode(parseInt(value) as Sortmode)}
                            >
                                <DropdownMenuRadioItem
                                    value="0"
                                    className="text-[11px] uppercase tracking-widest focus:bg-white/10 focus:text-white cursor-pointer"
                                >
                                    Position
                                </DropdownMenuRadioItem>

                                <DropdownMenuRadioItem
                                    value="1"
                                    className="text-[11px] uppercase tracking-widest focus:bg-white/10 focus:text-white cursor-pointer"
                                >
                                    Date Added
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
            
        </div>
    )
}
