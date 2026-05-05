import sqlite3

from core.models.artist import ArtistBase
from core.models.playlist import PlaylistBase, PlaylistSummary
from core.models.track import PlaylistTrack, TrackBase, TrackDetails


#validators for sql to custom types
def row_to_trackbase(
    row: sqlite3.Row
) -> TrackBase:
    UNIT_SEP = "\x1f"
    RECORD_SEP = "\x1e"

    #parse the artist blob back into ArtistBase objects
    artists = []
    for packet in row["artist_blob"].split(RECORD_SEP):
        parts = packet.split(UNIT_SEP)

        #explicit part handling
        a_internal_id = int(parts[0])
        a_id = parts[1] or None
        a_name = parts[2]
        a_name_display = parts[3] or None

        artists.append(ArtistBase(
            internal_id=a_internal_id,
            id=a_id,
            name=a_name,
            name_display=a_name_display
        ))

    #re-inflate into the TrackBase object (automatically type-casted)
    return TrackBase(
        internal_id=row["internal_id"],
        id=row["id"],
        title=row["title"],
        title_display=row["title_display"],
        duration=row["duration"],
        artists=artists
    )
    
def row_to_playlist_track(
    row: sqlite3.Row
) -> PlaylistTrack:
    trackbase = row_to_trackbase(row)

    return PlaylistTrack(
        **trackbase.model_dump(),
        added_at=row["added_at"],
        position=row["position"]
    )

def row_to_track_details(
    row: sqlite3.Row
) -> TrackDetails:
    trackbase = row_to_trackbase(row)

    UNIT_SEP = "\x1f"
    RECORD_SEP = "\x1e"

    #parse the playlist blob back into PlaylistBase objects
    playlists = []
    if row["playlist_blob"]: #only if this track is in any playlists
        for packet in row["playlist_blob"].split(RECORD_SEP):
            parts = packet.split(UNIT_SEP)

            #explicit part handling
            p_internal_id = int(parts[0])
            p_id = parts[1] or None
            p_name = parts[2]
            
            playlists.append(PlaylistBase(
                internal_id=p_internal_id,
                id=p_id,
                name=p_name
            ))

    return TrackDetails(
        **trackbase.model_dump(),
        playlists=playlists
    )


#playlists
def row_to_playlistbase(
    row: sqlite3.Row
) -> PlaylistBase:
    return PlaylistBase(
        internal_id=row["internal_id"],
        id=row["id"],
        name=row["name"]
    )

def row_to_playlist_summary(
    row: sqlite3.Row
) -> PlaylistSummary:
    playlistbase = row_to_playlistbase(row)

    return PlaylistSummary(
        **playlistbase.model_dump(),
        total_count=row["total_count"],
        total_duration=row["total_duration"],
        description=row["description"]
    )