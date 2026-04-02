import { create } from 'zustand';
import type { ArtistId, ArtistBase, TrackId, TrackNorm, TrackBase } from '@/model/model.types';
import { shredTrackBase } from '@/model/model.utils';

interface LibraryState {
    trackNorms: Record<TrackId, TrackNorm>;
    artistBases: Record<ArtistId, ArtistBase>;

    // process incoming API data
    addTracks: (incoming: TrackBase[]) => void;
}

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
}));
