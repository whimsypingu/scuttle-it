import traceback

from fastapi import APIRouter, Body, Depends, Path, Query, HTTPException

from api.dependencies import get_db_manager, get_device_context, get_dl_queue, queue_update_room_broadcast, set_room_active
from database.database_manager import DatabaseManager
from core.download.download_queue import DownloadQueue
from core.models.jobs import DownloadJob
from core.models.room import DeviceContext

from core.models.responses import PopQueueResponse, PushNextQueueResponse, PushQueueResponse, QueueResponse, SetAllQueueResponse, SetFirstQueueResponse, ShuffleQueueResponse
from core.models.payloads import ReorderQueuePayload

QueueRouter = APIRouter(prefix="/queue", tags=["Queue"], dependencies=[Depends(set_room_active)])

#temporary crash exception
DefaultCrashException = HTTPException(
    status_code=500,
    detail="Crashed"
)


@QueueRouter.post("/set-first", response_model=SetFirstQueueResponse, dependencies=[Depends(queue_update_room_broadcast)])
async def set_first_play_queue(
    ctx: DeviceContext = Depends(get_device_context),
    track_id: str = Query(..., min_length=1, description="Track ID to set first"),
    db_manager: DatabaseManager = Depends(get_db_manager),
    dl_queue: DownloadQueue = Depends(get_dl_queue)
):
    try:
        download_required = not await db_manager.is_track_downloaded(track_id) #playing a track that isn't available will begin a download
        if download_required: 
            job = DownloadJob(
                track_id=track_id,
                priority=True,
                room_id=ctx.room_id
            )
            await dl_queue.add(job)
        else:
            await db_manager.set_first_play_queue(track_id, ctx.room_id) #status after attempting set
        
        updated_queue = await db_manager.get_play_queue(ctx.room_id) #get the updated queue

        return {
            "download_required": download_required,
            "queue": updated_queue
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


@QueueRouter.patch("/reorder", dependencies=[Depends(queue_update_room_broadcast)])
async def reorder_queue(
    ctx: DeviceContext = Depends(get_device_context),
    payload: ReorderQueuePayload = Body(...), #automatically parse JSON body into pydantic model
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        await db_manager.reorder_queue(payload, ctx.room_id) #status after attempting reorder
        updated_queue = await db_manager.get_play_queue(ctx.room_id) #get the updated queue

        return {
            "queue": updated_queue
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


@QueueRouter.post("/push", response_model=PushQueueResponse, dependencies=[Depends(queue_update_room_broadcast)])
async def push_play_queue(
    ctx: DeviceContext = Depends(get_device_context),
    track_id: str = Query(..., min_length=1, description="Track ID to push"),
    db_manager: DatabaseManager = Depends(get_db_manager),
    dl_queue: DownloadQueue = Depends(get_dl_queue)
):
    try:
        download_required = not await db_manager.is_track_downloaded(track_id) #playing a track that isn't available will begin a download
        if download_required: 
            job = DownloadJob(
                track_id=track_id,
                priority=False, #low priority, append to back of queue
                room_id=ctx.room_id
            )
            await dl_queue.add(job)
        else:
            await db_manager.push_play_queue(track_id, ctx.room_id) #status after attempting push
    
        updated_queue = await db_manager.get_play_queue(ctx.room_id) #get the updated queue

        return {
            "download_required": download_required,
            "queue": updated_queue
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException
    

@QueueRouter.post("/push-next", response_model=PushNextQueueResponse, dependencies=[Depends(queue_update_room_broadcast)])
async def push_next_play_queue(
    ctx: DeviceContext = Depends(get_device_context),
    track_id: str = Query(..., min_length=1, description="Track ID to push next"),
    db_manager: DatabaseManager = Depends(get_db_manager),
    dl_queue: DownloadQueue = Depends(get_dl_queue)
):
    try:
        download_required = not await db_manager.is_track_downloaded(track_id) #playing a track that isn't available will begin a download
        if download_required: 
            job = DownloadJob(
                track_id=track_id,
                priority=True, #high priority, prepend to front of queue
                room_id=ctx.room_id
            )
            await dl_queue.add(job)
        else:
            await db_manager.push_next_play_queue(track_id, ctx.room_id) #status after attempting push
    
        updated_queue = await db_manager.get_play_queue(ctx.room_id) #get the updated queue

        return {
            "download_required": download_required,
            "queue": updated_queue
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


@QueueRouter.post("/pop", response_model=PopQueueResponse, dependencies=[Depends(queue_update_room_broadcast)])
async def pop_play_queue(
    ctx: DeviceContext = Depends(get_device_context),
    queue_id: int = Query(..., description="Unique instance ID of the queued track to pop"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        await db_manager.pop_play_queue(queue_id, ctx.room_id) #status after attempting pop
        updated_queue = await db_manager.get_play_queue(ctx.room_id) #get the updated queue

        return {
            "queue": updated_queue
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException
    

@QueueRouter.post("/shuffle", response_model=ShuffleQueueResponse, dependencies=[Depends(queue_update_room_broadcast)])
async def shuffle_play_queue(
    ctx: DeviceContext = Depends(get_device_context),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        await db_manager.shuffle_play_queue(ctx.room_id)
        updated_queue = await db_manager.get_play_queue(ctx.room_id)

        return {
            "queue": updated_queue
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


@QueueRouter.post("/set-all/playlist/{playlist_id}", response_model=SetAllQueueResponse, dependencies=[Depends(queue_update_room_broadcast)])
async def set_all_play_queue(
    ctx: DeviceContext = Depends(get_device_context),
    playlist_id: str = Path(..., min_length=1, description="Playlist ID"),
    sortmode: int = Query(default=0, ge=0, le=2, description="0=position, 1=added_at, 2=shuffle"),
    db_manager: DatabaseManager = Depends(get_db_manager),
    dl_queue: DownloadQueue = Depends(get_dl_queue)
):
    try:
        set_count, skipped = await db_manager.set_all_play_queue(playlist_id, sortmode, ctx.room_id) #status after attempting set
        updated_queue = await db_manager.get_play_queue(ctx.room_id) #get the updated queue -- EMERGENCY: make this stuff not like this bruh

        for track_id in skipped:
            job = DownloadJob(
                track_id=track_id,
                priority=False,
                room_id=ctx.room_id
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
    

@QueueRouter.post("/clear", response_model=QueueResponse, dependencies=[Depends(queue_update_room_broadcast)])
async def clear_play_queue_endpoint(
    ctx: DeviceContext = Depends(get_device_context),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        await db_manager.clear_play_queue(ctx.room_id) #status after attempting clear
        updated_queue = await db_manager.get_play_queue(ctx.room_id) #get the updated queue -- EMERGENCY: make this stuff not like this bruh

        return {
            "queue": updated_queue
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException


@QueueRouter.get("/get", response_model=QueueResponse)
async def get_play_queue(
    ctx: DeviceContext = Depends(get_device_context),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try: 
        results = await db_manager.get_play_queue(ctx.room_id)
        return {
            "queue": results
        }
    except Exception as e:
        traceback.print_exc()
        raise DefaultCrashException
    
