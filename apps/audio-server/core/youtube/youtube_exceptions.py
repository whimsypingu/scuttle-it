class YouTubeClientError(Exception):
    """Base exception for all YouTube client issues"""
    pass

class YtdlpUpdateError(YouTubeClientError):
    """Raised when yt-dlp update fails"""
    pass

class YtdlpDownloadError(YouTubeClientError):
    """Raised when yt-dlp fails"""
    pass

class YtdlpTimeoutError(YouTubeClientError):
    """Raised when yt-dlp times out"""
    pass

class YtdlpMetadataError(YouTubeClientError):
    """Raised when metadata extraction from yt-dlp fails"""
    pass

class YtdlpSearchError(YouTubeClientError):
    """Raised when search from yt-dlp fails"""
    pass