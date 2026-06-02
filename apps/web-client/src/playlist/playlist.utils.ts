// src/playlist/playlist.utils.ts
import { useEditTarget } from '@/features/edit/EditProvider';
import { useSetQueue } from '@/store/hooks/useQueue';
import { usePinsMutations } from '@/store/hooks/usePlaylists';

import { makeToast } from '@/features/toast/Toast';

import type { ActiveEditTarget } from '@/features/edit/edit.types';
import type { PlaylistActionProps } from '@/playlist/playlist.types';
import type { Sortmode } from '@/store/hooks/hooks.types';
import { REORDER_BLACKLIST } from './playlist.constants';


export const usePlaylistActionHandler = () => {
    //access the mutations from the tanstack query hook
    const { setPlaylist } = useSetQueue();
    const { setPin } = usePinsMutations();
    const { setEditTarget } = useEditTarget();

    const handleAction = (props: PlaylistActionProps) => {
        console.log(props.action);
        
        switch (props.action) {
            case "pin": //pin a playlist
                setPin({
                    playlist: props.playlist,
                    pinned: true,
                });
                break;

            case "unpin": //unpin a playlist
                setPin({
                    playlist: props.playlist,
                    pinned: false,
                });
                break;

            case "delete":
                makeToast(props.action);
                break;

            case "play":
                setPlaylist({
                    playlist: props.playlist,
                });
                break;

            case "delete":
                makeToast(props.action);
                break;

            case "shufflePlay":
                setPlaylist({
                    playlist: props.playlist,
                    sortmode: 2,
                });
                break;

            case "edit": //open a playlist editing popup
                const editPlaylistTarget: ActiveEditTarget = {
                    type: "editPlaylist",
                    data: props.playlist,
                };
                setEditTarget(editPlaylistTarget);
                break;
        }
    };

    return handleAction;
};


export const isPlaylistReorderable = (playlistId: string | undefined, sortmode: Sortmode | undefined): boolean => {
    if (!playlistId) return false;

    if (sortmode !== 0) return false;

    if (REORDER_BLACKLIST.includes(playlistId as any)) return false;

    return true;
}