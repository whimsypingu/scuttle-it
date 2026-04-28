//useEdit

//see: audio-server/core/models/artist.py
export interface EditArtistPayload {
    id?: string;
    newId?: string;
    nameDisplay?: string;
}

//see: audio-server/core/models/track.py
export interface EditTrackPayload {
    id?: string;
    newId?: string;
    titleDisplay?: string;
    artists?: EditArtistPayload[];
}