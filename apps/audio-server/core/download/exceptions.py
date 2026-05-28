class WorkerSignal(Exception):
    """Base class for controlling execution flow inside the DownloadWorker."""
    pass

class DownloadWorkerJobExpanded(WorkerSignal):
    """Raised when a parent job (like a playlist) is successfully broken into sub-jobs."""
    pass

