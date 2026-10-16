class WorkerSignal(Exception):
    """Base class for controlling execution flow inside the EnrichWorker."""
    pass

class EnrichWorkerJobSkipped(WorkerSignal):
    """Raised when a parent job is successfully skipped."""
    pass

class EnrichWorkerJobError(WorkerSignal):
    """Raised when a worker fails to process a job."""
    pass