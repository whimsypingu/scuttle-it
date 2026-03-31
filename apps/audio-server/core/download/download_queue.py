import asyncio
import logging

from collections import deque
from core.models.jobs import DownloadJob

logger = logging.getLogger(__name__)


class DownloadQueue:
    def __init__(self):
        self._queue: deque[DownloadJob] = deque()

        self._lock = asyncio.Lock()

        #doorbell to wake up the worker loop
        self._new_job_event = asyncio.Event()

    async def add(self, job: DownloadJob):
        """Adds a job"""
        async with self._lock:
            if job.priority:
                self._queue.appendleft(job)
                logger.info(f"Priority job added to front of Download Queue: {job.identifier}")
            else:
                self._queue.append(job)
                logger.info(f"Job added to back of Download Queue: {job.identifier}")

            #ring the doorbell
            self._new_job_event.set()

    async def get_next(self) -> DownloadJob:
        """Blocks until a job is available, then returns it."""
        while True:
            async with self._lock:
                if self._queue:
                    return self._queue.popleft() #go to work
                
                #if empty, reset the doorbell so we can wait for it again
                self._new_job_event.clear() 

            #wait here without doing anything until .set() is called in add()
            await self._new_job_event.wait()

    @property
    def pending_count(self) -> int:
        return len(self._queue)
    