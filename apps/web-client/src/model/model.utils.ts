// src/model/model.utils.ts
import type { TrackNorm, TrackBase } from '@/model/model.types';


/**
 * Maps raw API response (snake_case) TrackBase to frontend TrackBase (camelCase)
 */
export const makeSafeApiTrackBase = (track: any): TrackBase => {
    //snake_case to camelCase
    return {
        id: track.id,
        title: track.title,
        titleDisplay: track.title_display,
        duration: track.duration,
        artists: track.artists.map((a: any) => ({
            id: a.id,
            name: a.name,
            nameDisplay: a.name_display
        }))
    };
};

export const shredTrackBase = (track: TrackBase): TrackNorm => {
    const { artists, ...rest } = track;
    return {
        ...rest,
        artistIds: artists.map(a => a.id)
    };
};