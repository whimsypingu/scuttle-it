import type { ArtistId, ArtistBase, TrackId, TrackNorm, TrackBase, QueueTrack } from '@/model/model.types';

export interface LibraryState {
    trackNorms: Record<TrackId, TrackNorm>;
    artistBases: Record<ArtistId, ArtistBase>;

    // process incoming API data
    addTracks: (incoming: TrackBase[]) => void;

    playingTrackId: TrackId | null;
    setPlayingTrackId: (id: TrackId | null) => void;
}

export interface QueueResponse {
    success: boolean;
    queue: QueueTrack[];
}