class YoutubeClientError(Exception):
    """Base exception for all YouTube client issues"""
    pass

class YtdlpUpdateError(YoutubeClientError):
    """Raised when yt-dlp update fails"""
    pass

class YtdlpDownloadError(YoutubeClientError):
    """Raised when yt-dlp fails"""
    pass

class YtdlpTimeoutError(YoutubeClientError):
    """Raised when yt-dlp times out"""
    pass

class YtdlpMetadataError(YoutubeClientError):
    """Raised when metadata extraction from yt-dlp fails"""
    pass