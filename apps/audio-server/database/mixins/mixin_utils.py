import sqlite3

from core.models.artist import ArtistBase
from core.models.track import TrackBase

def row_to_trackbase(
    row: sqlite3.Row
):
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
    
