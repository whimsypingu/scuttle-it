import asyncio
import logging
from collections import deque

from core.models.jobs import EnrichJob, JobStatus

logger = logging.getLogger(__name__)


class EnrichQueue:
    def __init__(self, history_limit: int = 10):
        self._queue: deque[EnrichJob] = deque()
        self._processing: dict[str, EnrichJob] = {} #mapping for current jobs via {id: job}
        self._completed: deque[EnrichJob] = deque(maxlen=history_limit)

        self.ENRICH_EXPIRE_TIME = 10 * 24 * 60 * 60 #10 days

        self._lock = asyncio.Lock()

        #doorbell to wake up the worker loop
        self._new_job_event = asyncio.Event()

    async def add(self, job: EnrichJob):
        """Adds a job"""
        async with self._lock:
            #prevent duplicates 
            if any(active_job.identifier == job.identifier for active_job in self._processing.values()):
                logger.warning(f"[ENR-Queue] Duplicate blocked: {job.identifier} is actively being processed right now.")
                return
            if any(queued_job.identifier == job.identifier for queued_job in self._queue):
                logger.warning(f"[ENR-Queue] Duplicate blocked: {job.identifier} is already waiting to be processed.")
                return

            #add to the process queue
            self._queue.append(job) 
            logger.info(f"[ENR-Queue] Job added to back of Enrich Queue: {job.identifier} ({job.id})")

            #ring the doorbell
            self._new_job_event.set()

    async def get_next(self) -> EnrichJob:
        """Blocks until a job is available, then returns it."""
        while True:
            async with self._lock:
                if self._queue:
                    job = self._queue.popleft() 

                    job.status = JobStatus.PROCESSING #move from pending to processing
                    self._processing[job.id] = job
                    return job #go to work
                
                #if empty, reset the doorbell so we can wait for it again
                self._new_job_event.clear() 

            #wait here without doing anything until .set() is called in add()
            await self._new_job_event.wait()

    async def complete_job(self, id: str, success: bool = True):
        """Worker calls this when done."""
        async with self._lock:
            job = self._processing.pop(id)

            if job:
                job.status = JobStatus.COMPLETED if success else JobStatus.FAILED
                self._completed.append(job)
                logger.info(f"[ENR-Queue] Job moved to history. Status: {job.status} ({job.id})")
            else:
                logger.warning(f"[ENR-Queue] Attempted to complete job for id {id} but it wasn't in _processing.")

    async def get_all_jobs(self) -> list[EnrichJob]:
        """Combine for the API endpoint"""
        async with self._lock:
            completed_jobs = list(self._completed) #completed deque, ordered from oldest first to newest last
            processing_jobs = list(self._processing.values()) #no particular order among currently processing jobs
            pending_jobs = list(self._queue)

            return completed_jobs + processing_jobs + pending_jobs
    

    #deprecated? NOT USED
    @property
    def pending_count(self) -> int:
        return len(self._queue)
    
    @property
    def processing_count(self) -> int:
        return len(self._processing)
    