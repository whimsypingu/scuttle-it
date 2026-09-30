class WorkerSignal(Exception):
    """Base class for controlling execution flow inside the EnrichWorker."""
    pass

class EnrichWorkerJobExpanded(WorkerSignal):
    """Raised when a parent job (like an artist) is successfully broken into sub-jobs."""
    pass

class EnrichWorkerJobError(WorkerSignal):
    """Raised when a worker fails to process a job."""
    pass