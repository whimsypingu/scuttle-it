const AUDIO_CACHE_NAME = "audio-cache-v1";
const AUDIO_ROUTER_PATH_PREFIX = "/audio/stream";

const STATIC_CACHE_NAME = "static-cache-v1";
const STATIC_FILES_PATH_PREFIX = "/static";

//console logging on desktop
function swLog(...args) {
    const msg = args.map(a => String(a)).join(" ");
    //console.log(`[SW] ${msg}`); //debugging duplicated log.
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({ type: "log", msg: msg });
        });
    });
}

//install event: optional, can pre-cache static assets if needed
self.addEventListener("install", (event) => {
    swLog("Installing...");
    self.skipWaiting(); //activate immediately
});

self.addEventListener("activate", (event) => {
    swLog("Activating and cleaning old caches...");

    event.waitUntil(
        (async () => {
            //delete old caches, might be killing too much
            const keys = await caches.keys();
            await Promise.all(keys.map(key => caches.delete(key)));
            swLog("Cache reset on activation");
        })()
    );

    self.clients.claim(); //take control immediately
});


self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    //only intercept /audio/stream requests
    if (url.pathname.startsWith(AUDIO_ROUTER_PATH_PREFIX)) {
        swLog("Audio fetch intercepted");
        const cleanUrl = url.origin + url.pathname; //cleanUrl has a removed ?t= to extract the useful identifier url part as the cache key
        event.respondWith(handleAudioStreamRequest(event.request, cleanUrl));
    }

    //only intercept /static requests
    if (url.pathname.startsWith(STATIC_FILES_PATH_PREFIX)) {
        event.respondWith(handleStaticFileRequest(event.request));
    }
});


self.addEventListener("message", (event) => {
    if (!event.data || !event.data.type) return;

    switch (event.data.type) {
        case "UPDATE_PREFETCH_QUEUE":
            if (prefetchDebounce) {
                clearTimeout(prefetchDebounce);
            }

            prefetchDebounce = setTimeout(() => {
                swLog("New prefetch queue received from frontend");

                prefetchQueue = event.data.tracks; //see: apps/web-client/src/features/audio/useAudioEngine.ts -> usePrefetchSync
                processQueue().catch(err => {
                    swLog(`Prefetch Queue Error: ${err.message}`);
                });
            
                prefetchDebounce = null;
            }, 1000);

            break;
        
        default:
            swLog(`Unknown Service Worker message type received: ${event.data.type}`);
    }
});


// --- AUDIO REQUESTS ---
let prefetchQueue = []; //array of TrackBases
let prefetchDebounce = null;
let currentFetch = null; //stores { track, controller }

async function processQueue() {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    let targetTrack = null; //next TrackBase item to attempt to pre-cache
    let cleanUrl = null; //cleanUrl of a TrackBase

    //look through the prefetchQueue and stop after finding the first TrackBase to attempt pre-caching for
    for (const track of prefetchQueue) { 
        cleanUrl = `/audio/stream/${track.id}`; 
        const isCached = await cache.match(cleanUrl);
        if (!isCached) {
            targetTrack = track;
            break;
        }
    }

    if (!targetTrack) return; //everything cached
    if (currentFetch) {
        //track being prefetched is somewhere in the prefetchQueue -- don't cancel it since it's still useful
        if (prefetchQueue.some(t => t.id === currentFetch.track.id)) {
            return;
        }

        //something is being prefetched but it is no longer in the prefetchQueue, kill the prefetch to prioritize something more useful
        currentFetch.controller.abort();
    }

    await startFetch(targetTrack, cleanUrl);
}

async function startFetch(track, cleanUrl) {
    const controller = new AbortController(); 
    currentFetch = { track: track, controller: controller }; //set currentFetch to the current fetch request

    try {
        swLog(`Starting Prefetch: ${track.id}`);
        const dirtyUrl = `${cleanUrl}?t=${Date.now()}`; //date embedded fetch url for preventing browser auto-caching behavior

        const res = await fetch(dirtyUrl, {
            signal: controller.signal,
            cache: "no-store"
        });
        if (!res.ok) throw new Error(`Prefetch failed: ${res.status}`);

        const cache = await caches.open(AUDIO_CACHE_NAME);
        await cache.put(cleanUrl, res.clone()); //cache with the cleanUrl path for future streams to match

        swLog(`Prefetch Complete: ${track.id}`);
    } catch (err) {
        if (err.name === "AbortError") {
            swLog(`Prefetch Aborted: ${track.id}`);
        } else {
            swLog(`Prefetch Error for ${track.id}: ${err.message}`);
        }
    } finally {
        if (currentFetch.track.id === track.id) currentFetch = null; //set currentFetch to null when fetch completes and is the current one
        processQueue();
    }
}

async function handleAudioStreamRequest(request, cleanUrl) {
    //check cache
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const cachedResponse = await cache.match(cleanUrl); //match cache on cleanUrl -- without embedded date

    if (cachedResponse) {
        swLog(`Cache Hit: Serving local copy of ${cleanUrl.split('/').pop()}`);
        return serveManualCachedResponse(cachedResponse, request);
    }

    // fallthru: get the audio playing as soon as possible via standard request
    swLog(`Cache Miss: Streaming from network ${cleanUrl.split('/').pop()}`);
    return fetch(request);
}

async function serveManualCachedResponse(cachedResponse, request) {
    try {
        //load the whole thing into memory and use array slicing for near instant serve
        const fullBlob = await cachedResponse.blob(); 
        const totalSize = fullBlob.size;

        if (totalSize === 0) throw new Error("Empty Cache Entry"); //blank entry check

        const rangeHeader = request.headers.get("Range");

        //no range is requested just serve full audio
        if (!rangeHeader) {
            return cachedResponse;
        }

        //parse range "bytes=[start]-[end]"
        const parts = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1; //bytes are inclusive so must do len-1: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Range

        //safety checks
        const chunkStart = Math.max(0, start);
        const chunkEnd = Math.min(end, totalSize - 1);
        const chunk = fullBlob.slice(chunkStart, chunkEnd + 1); //non-inclusive end so must add 1: https://developer.mozilla.org/en-US/docs/Web/API/Blob/slice

        swLog(`Serving cache slice: ${chunkStart}-${chunkEnd} of ${totalSize}`);

        return new Response(chunk, {
            status: 206,
            statusText: "Partial Content",
            headers: {
                ...Object.fromEntries(cachedResponse.headers.entries()), //copy original headers
                "Content-Range": `bytes ${chunkStart}-${chunkEnd}/${totalSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunk.size,
                "Status": 206
            }
        });
    } catch (err) {
        swLog(`Cache Read Failed. Falling through to network: ${err}`);
        return fetch(request);
    }
}


// --- STATIC REQUESTS ---
async function handleStaticFileRequest(request) {
    const cache = await caches.open(STATIC_CACHE_NAME);

    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;

    try {
        const networkResponse = await fetch(request);

        if (networkResponse && networkResponse.status === 200) {
            await cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (err) {
        swLog(`Static Network Fetch Failed: ${err}`);
    }
}