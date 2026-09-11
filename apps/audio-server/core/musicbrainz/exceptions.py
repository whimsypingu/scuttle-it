class MusicBrainzClientError(Exception):
    """Base exception for all MusicBrainz client issues"""
    pass

class MusicBrainzServerUnavailableError(MusicBrainzClientError):
    """Raised when musicbrainz server rejects queries with 503"""
    pass

class MusicBrainzServerError(MusicBrainzClientError):
    """Raised when musicbrainz server fails"""
    pass

# class YtdlpTimeoutError(YouTubeClientError):
#     """Raised when yt-dlp times out"""
#     pass

# class YtdlpMetadataError(YouTubeClientError):
#     """Raised when metadata extraction from yt-dlp fails"""
#     pass

# class YtdlpSearchError(YouTubeClientError):
#     """Raised when search from yt-dlp fails"""
#     pass