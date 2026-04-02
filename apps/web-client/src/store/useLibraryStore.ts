import { create } from 'zustand';

import { shredTrackBase } from '@/model/model.utils';

import type { LibraryState } from '@/store/store.types';

export const useLibraryStore = create<LibraryState>((set) => ({
    trackNorms: {},
    artistBases: {},

    addTracks: (incoming) => set((state) => {
        const nextTracks = { ...state.trackNorms };
        const nextArtists = { ...state.artistBases };

        incoming.forEach((track) => {
            // shred artists
            track.artists.forEach((a) => {
                nextArtists[a.id] = a //a is already an ArtistBase
            });

            // shred TrackBase into TrackNorm for storage
            nextTracks[track.id] = shredTrackBase(track);
        });

        return {
            trackNorms: nextTracks,
            artistBases: nextArtists
        };
    }),

    playingTrackId: null,
    setPlayingTrackId: (id) => set({ playingTrackId: id }),
}));

//hooks
export const useAddTracks = () => useLibraryStore((s) => s.addTracks);
export const usePlayingTrackId = () => useLibraryStore((s) => s.playingTrackId);
export const useSetPlayingTrackId = () => useLibraryStore((s) => s.setPlayingTrackId);