import type { ArtistId, ArtistBase, TrackId, TrackNorm, TrackBase } from '@/model/model.types';

export interface LibraryState {
    trackNorms: Record<TrackId, TrackNorm>;
    artistBases: Record<ArtistId, ArtistBase>;

    // process incoming API data
    addTracks: (incoming: TrackBase[]) => void;

    playingTrackId: TrackId | null;
    setPlayingTrackId: (id: TrackId | null) => void;
}
