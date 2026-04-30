import type { PlaylistInfoProps } from '@/features/playlist/playlist.types';
import { XIcon } from '@phosphor-icons/react';


export const PlaylistInfo = ({
    scrollContext
}: PlaylistInfoProps) => {
    const { 
        totalCount, 
        sortBy, 
        setSortBy 
    } = scrollContext;

    const isSortable = sortBy && setSortBy;

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
            <div className="ml-auto flex items-center gap-2">
                {/* PLAY ALL */}
                <button className="flex items-center justify-center w-6 h-6 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors">
                    <XIcon size={16} weight="bold" />
                </button>
                
                {/* SHUFFLE */}
                <button className="flex items-center justify-center w-6 h-6 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all">
                    <XIcon size={18} weight="bold" />
                </button>

                {/* SORT TRIGGER */}
                {isSortable && (
                    <button 
                        onClick={() => setSortBy(sortBy === 'position' ? 'addedAt' : 'position')}
                        className="flex items-center gap-1.5 px-3 h-8 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all border-l border-white/10 ml-1"
                    >
                        <XIcon size={16} />
                        <span className="text-[10px] uppercase font-black tracking-tighter">
                            {sortBy === 'position' ? 'Manual' : 'Recent'}
                        </span>
                    </button>
                )}
            </div>
            
        </div>
    )
}