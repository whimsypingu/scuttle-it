// src/model/model.utils.ts
import { makeToast } from '@/features/toast/Toast';
import type { TrackNorm, TrackBase, TrackActionProps, ArtistBase } from '@/model/model.types';

import { useQueue } from '@/store/hooks/useQueue';

export const useTrackActionHandler = () => {
    //access the mutations from the tanstack query hook
    const { push, pop } = useQueue();

    const handleAction = (props: TrackActionProps) => {
        switch (props.action) {
            case "queueLast": //add to queue
                console.log(props.action);
                makeToast(props.action);
                push(props.trackId);
                break;

            case "delete":
                console.log(props.action);
                makeToast(props.action);
                break;

            case "deleteQueue": //delete from queue
                console.log(props.action);
                makeToast(props.action);
                pop(props.queueId);
                break;

            case "edit":
                console.log(props.action);
                makeToast(props.action);
                break;

            case "like":
                console.log(props.action);
                makeToast(props.action);
                break;
        }
    };

    return handleAction;
};

export const shredTrackBase = (track: TrackBase): TrackNorm => {
    const { artists, ...rest } = track;
    return {
        ...rest,
        artistIds: artists.map(a => a.id)
    };
};

export const makeSafeApiTrackBase = (
    track: Partial<TrackNorm> | null | undefined,
    allArtists: Record<string, ArtistBase> = {}
): TrackBase => {
    // 1. Provide safe defaults for the base track object
    const safeTrack: TrackNorm = {
        id: track?.id ?? "unknown-id",
        title: track?.title ?? "Unknown Title",
        titleDisplay: track?.titleDisplay,
        artistIds: track?.artistIds ?? [],
        duration: track?.duration ?? 0,
    };

    // 2. Map artist IDs to actual Artist objects using your lookup table
    // If an artist isn't found in the record, create a placeholder
    const artists: ArtistBase[] = safeTrack.artistIds.map((id) => {
        return allArtists[id] ?? { id, name: "Unknown Artist" };
    });

    // 3. Return the fully formed TrackBase
    return {
        ...safeTrack,
        artists,
    };
};