class MusicBrainzClientError(Exception):
    """Base exception for all MusicBrainz client issues"""
    pass

class MusicBrainzServerError(MusicBrainzClientError):
    """Raised when musicbrainz server fails"""
    pass
