//helper to turn seconds into MM:SS
export const formatTime = (s: number) => {
    if (isNaN(s)) return "--:--";
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

//helper to turn seconds into text formatted duration
export const formatReadableTime = (s: number): string => {
    if (isNaN(s)) return "0s";

    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = Math.floor(s % 60);

    //more than an hour, eg: 1h 2m
    if (hrs > 0) {
        return `${hrs}h ${mins}m`;
    }

    //minutes and seconds, eg: 2m 45s
    if (mins > 0) {
        return `${mins}m ${secs}s`;
    }

    //just the seconds, eg: 45s
    return `${secs}s`;
}


const AUDIO_CACHE_PREFIX = "audio-cache-v"; //dynamic finder, see: /public/sw.js
let audioCacheName: string | null = null;

//finds and remembers the active audio cache name matching the prefix.
export async function getAudioCacheName(): Promise<string | null> {
    if (!("caches" in window)) return null;

    //return memoized key if already resolved
    if (audioCacheName) {
        return audioCacheName;
    }

    try {
        const keys = await caches.keys();

        const activeKey = keys.find((key) => key.startsWith(AUDIO_CACHE_PREFIX));

        // //debug
        // console.log("getAudioCacheName(): ", keys);
        // console.log("getAudioCacheName(): ", activeKey);

        if (activeKey) {
            audioCacheName = activeKey; //store in memory
            return activeKey;
        }
    } catch (err) {
        console.warn("[audio.utils] Failed to fetch cache keys:", err);
    }

    return null;
}

export function resetAudioCacheName(): void {
    audioCacheName = null;
}

export async function isTrackCached(trackId: string): Promise<boolean> {
    if (!trackId || !("caches" in window)) return false;

    try {
        const cacheName = await getAudioCacheName();
        if (!cacheName) return false;

        const cache = await caches.open(cacheName);
        const cleanUrl = `/audio/stream/${trackId}`;
        const response = await cache.match(cleanUrl);

        return !!response && (response.ok || response.status === 206);
    } catch (err) {
        resetAudioCacheName(); //clear memory referencein case stale or wrong cache
        console.warn(`[audio.utils] Error checking cache for track ${trackId}:`, err);
        return false;
    }
}