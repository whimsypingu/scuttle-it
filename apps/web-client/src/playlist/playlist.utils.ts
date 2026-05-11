// src/playlist/playlist.utils.ts
import { useEditTarget } from '@/features/edit/EditProvider';
import { useSetQueue } from '@/store/hooks/useQueue';

import { makeToast } from '@/features/toast/Toast';

import type { ActiveEditTarget } from '@/features/edit/edit.types';
import type { PlaylistActionProps } from '@/playlist/playlist.types';
import type { SetAllPlaylistMutationProps } from '@/store/hooks/hooks.types';


export const usePlaylistActionHandler = () => {
    //access the mutations from the tanstack query hook
    const { setPlaylist } = useSetQueue();
    const { setEditTarget } = useEditTarget();

    const handleAction = (props: PlaylistActionProps) => {
        console.log(props.action);
        
        switch (props.action) {
            case "pin": //pin a playlist
                makeToast(props.action);
                break;

            case "delete":
                makeToast(props.action);
                break;

            case "play":
                const setAllPlaylistVars: SetAllPlaylistMutationProps = {
                    playlist: props.playlist,
                    successMsg: "Playing",
                };
                setPlaylist(setAllPlaylistVars);
                break;

            case "delete":
                makeToast(props.action);
                break;

            case "shufflePlay":
                makeToast(props.action);
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
