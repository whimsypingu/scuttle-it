const CACHE_NAME = "audio-cache-v1";
const AUDIO_ROUTER_PATH_PREFIX = "/audio/stream";
const STATIC_FILES_PATH_PREFIX = "/static";

//console logging on desktop
function swLog(...args) {
    const msg = `[SW] ${args.map(a => String(a)).join(" ")}`;
    //console.log(msg); //debugging duplicated log.
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
        swLog("Fetch found");
        event.respondWith(handleAudioStreamRequest(event.request));
    }
});

let lastFetchedUrl = null; //most recently fetched audio url, to be used as a guard for freshly cached audio (this url will require a network fetch)
async function handleAudioStreamRequest(request) {
    const url = request.url;

    // case 1: freshly cached guard, if the song was just put in the cache, continue using network fetches to prevent stream lock glitches
    if (url === lastFetchedUrl) {
        swLog(`Freshly Cached: Staying on network for stability: ${url.split('/').pop()}`);
        return fetch(request);
    }

    // case 2: already cached - check cache for audio and serve manually if available
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);

    if (cachedResponse) {
        swLog(`Cache Hit: Serving local copy of ${url.split('/').pop()}`);
        lastFetchedUrl = null;
        return serveManualCachedResponse(cachedResponse, request);
    }

    // case 3: new audio - trigger background archive of full audio with stripped headers for a 200 OK response
    swLog(`Archive Start: Fetching full audio for ${url.split('/').pop()}`);
    lastFetchedUrl = url;

    const triggerArchival = async () => { //run this in the background
        try {
            const res = await fetch(url, { cache: "no-store" });
            if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);

            const cache = await caches.open(CACHE_NAME);
            await cache.put(url, res.clone());

            swLog(`Archiving: ${url.split('/').pop()} cached`);
        } catch (err) {
            swLog(`Archival Failed: ${url.split('/').pop()}: ${err.message}`);
        }
    }
    triggerArchival();

    // fallthru: get the audio playing as soon as possible via standard request
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
                "Content-Range": `bytes ${chunkStart}-${chunkEnd}/${totalSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunk.size,
                "Content-Type": cachedResponse.headers.get("Content-Type") || "audio/mpeg"
            }
        });
    } catch (err) {
        swLog(`Cache Read Failed. Falling through to network: ${err}`);
        return fetch(request);
    }
}