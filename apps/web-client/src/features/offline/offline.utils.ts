import { set, get, update } from "idb-keyval";

import type { TrackId, TrackBase, QueueTrack, PlaylistTrack } from "@/track/track.types";
import { queueTrackToTrackBase, trackBaseToPlaylistTrack } from "@/track/track.utils";
import { getAudioCacheName, resetAudioCacheName } from "@/features/audio/audio.utils";


const OFFLINE_CACHE_KEY = "SCUTTLE_OFFLINE_TRACKS_CACHE"

//upsert metadata into the custom scuttle offline cache (over-caches tracks to ensure metadata matches whatever is in cache api)
export async function savePrefetchWindowMetadata(prefetchWindow: QueueTrack[]): Promise<void> {
    try {
        await update<TrackBase[]>(OFFLINE_CACHE_KEY, (existingTracks = []) => {
            //build map keyed by track id using existing cache entries
            const trackMap = new Map<TrackId, TrackBase>(
                existingTracks.map((track) => [track.id, track])
            );

            //convert and upsert new tracks overwriting pre existing track ids
            for (const queueTrack of prefetchWindow) {
                const track: TrackBase = queueTrackToTrackBase(queueTrack);
                trackMap.set(track.id, track);
            }

            return Array.from(trackMap.values());
        });
    } catch (err) {
        console.error(`[offline.utils] Failed to upsert prefetch metadata:`, err);
    }
}

//retrieves and normalizes offline TrackBase[] into PlaylistTrack[]
export async function getCachedTrackMetadata(): Promise<PlaylistTrack[]> {
    if (!("caches" in window)) return [];

    try {
        const cacheName = await getAudioCacheName();
        if (!cacheName) return [];

        //extract track ids from cached request urls like /audio/stream/{trackId}
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();

        const cachedTrackIds = new Set<string>();
        for (const req of requests) {
            const url = new URL(req.url);
            const pathParts = url.pathname.split("/");
            const trackId = pathParts[pathParts.length - 1];

            if (trackId) {
                cachedTrackIds.add(trackId);
            }
        }

        if (cachedTrackIds.size === 0) return [];

        //get all the stored metadata and filter them based on if they have cached audio
        const storedTracks = await get<TrackBase[]>(OFFLINE_CACHE_KEY);
        if (storedTracks === undefined) return [];

        const now = Date.now();
        const playlistTracks: PlaylistTrack[] = [];

        for (const track of storedTracks) {
            if (cachedTrackIds.has(track.id)) {
                playlistTracks.push(
                    trackBaseToPlaylistTrack(
                        track,
                        now,
                        now,
                    )
                );
            }
        }

        return playlistTracks;
    } catch(err) {
        resetAudioCacheName();
        console.warn(`[offline.utils] Error getting cached track metadata: ${err}`);

        return [];
    }
}