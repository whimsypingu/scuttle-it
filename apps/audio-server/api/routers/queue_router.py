import traceback

from fastapi import APIRouter, Depends, Path, Query, HTTPException

from api.dependencies import get_db_manager, get_dl_queue
from database.database_manager import DatabaseManager
from core.download.download_queue import DownloadQueue
from core.models.jobs import DownloadJob

from core.models.responses import PopQueueResponse, PushNextQueueResponse, PushQueueResponse, SetAllQueueResponse, SetFirstQueueResponse, ShuffleQueueResponse

QueueRouter = APIRouter(prefix="/queue", tags=["Queue"])

#temporary crash exception
DefaultCrashException = HTTPException(
    status_code=500,
    detail="Crashed"
)


@QueueRouter.post("/set-first", response_model=SetFirstQueueResponse)
async def set_first_play_queue(
    track_id: str = Query(..., min_length=1, description="Track ID to set first"),
    db_manager: DatabaseManager = Depends(get_db_manager),
    dl_queue: DownloadQueue = Depends(get_dl_queue)
):
    try:
        download_required = not await db_manager.is_track_downloaded(track_id) #playing a track that isn't available will begin a download
        if download_required: 
            job = DownloadJob(
                track_id=track_id,
                priority=True
            )
            await dl_queue.add(job)
        else:
            await db_manager.set_first_play_queue(track_id) #status after attempting set
        
        updated_queue = await db_manager.get_play_queue() #get the updated queue

        return {
            "download_required": download_required,
            "queue": updated_queue
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


@QueueRouter.post("/reorder")
async def reorder_queue(
    queue_id: int = Query(..., description="Unique instance ID of the queued track to reorder"),
    target_position: float = Query(..., description="Target position float"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        await db_manager.reorder_queue(queue_id, target_position) #status after attempting reorder
        updated_queue = await db_manager.get_play_queue() #get the updated queue

        return {
            "queue": updated_queue
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


@QueueRouter.post("/push", response_model=PushQueueResponse)
async def push_play_queue(
    track_id: str = Query(..., min_length=1, description="Track ID to push"),
    db_manager: DatabaseManager = Depends(get_db_manager),
    dl_queue: DownloadQueue = Depends(get_dl_queue)
):
    try:
        download_required = not await db_manager.is_track_downloaded(track_id) #playing a track that isn't available will begin a download
        if download_required: 
            job = DownloadJob(
                track_id=track_id,
                priority=False #low priority, append to back of queue
            )
            await dl_queue.add(job)
        else:
            await db_manager.push_play_queue(track_id) #status after attempting push
    
        updated_queue = await db_manager.get_play_queue() #get the updated queue

        return {
            "download_required": download_required,
            "queue": updated_queue
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException
    

@QueueRouter.post("/push-next", response_model=PushNextQueueResponse)
async def push_next_play_queue(
    track_id: str = Query(..., min_length=1, description="Track ID to push next"),
    db_manager: DatabaseManager = Depends(get_db_manager),
    dl_queue: DownloadQueue = Depends(get_dl_queue)
):
    try:
        download_required = not await db_manager.is_track_downloaded(track_id) #playing a track that isn't available will begin a download
        if download_required: 
            job = DownloadJob(
                track_id=track_id,
                priority=True #high priority, prepend to front of queue
            )
            await dl_queue.add(job)
        else:
            await db_manager.push_next_play_queue(track_id) #status after attempting push
    
        updated_queue = await db_manager.get_play_queue() #get the updated queue

        return {
            "download_required": download_required,
            "queue": updated_queue
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


@QueueRouter.post("/pop", response_model=PopQueueResponse)
async def pop_play_queue(
    queue_id: int = Query(..., description="Unique instance ID of the queued track to pop"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        await db_manager.pop_play_queue(queue_id) #status after attempting pop
        updated_queue = await db_manager.get_play_queue() #get the updated queue

        return {
            "queue": updated_queue
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException
    

@QueueRouter.post("/shuffle", response_model=ShuffleQueueResponse)
async def shuffle_play_queue(
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        await db_manager.shuffle_play_queue()
        updated_queue = await db_manager.get_play_queue()

        return {
            "queue": updated_queue
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


@QueueRouter.post("/set-all/playlist/{playlist_id}", response_model=SetAllQueueResponse)
async def set_all_play_queue( 
    playlist_id: str = Path(..., min_length=1, description="Playlist ID"),
    sortmode: int = Query(default=0, ge=0, le=2, description="0=position, 1=added_at, 2=shuffle"),
    db_manager: DatabaseManager = Depends(get_db_manager),
    dl_queue: DownloadQueue = Depends(get_dl_queue)
):
    try:
        set_count, skipped = await db_manager.set_all_play_queue(playlist_id, sortmode) #status after attempting set
        updated_queue = await db_manager.get_play_queue() #get the updated queue -- EMERGENCY: make this stuff not like this bruh

        for track_id in skipped:
            job = DownloadJob(
                track_id=track_id,
                priority=False
            )
            await dl_queue.add(job)

        return {
            "set_count": set_count,
            "skip_count": len(skipped),
            "queue": updated_queue
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException
    

@QueueRouter.post("/clear")
async def clear_play_queue_endpoint(
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        await db_manager.clear_play_queue() #status after attempting clear
        updated_queue = await db_manager.get_play_queue() #get the updated queue -- EMERGENCY: make this stuff not like this bruh

        return {
            "queue": updated_queue
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


@QueueRouter.get("/get")
async def get_play_queue(
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try: 
        results = await db_manager.get_play_queue()
        return {
            "queue": results
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException
    
