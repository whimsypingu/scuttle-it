const CACHE_NAME = "audio-cache-v1";
const AUDIO_ROUTER_PATH_PREFIX = "/audio/stream";

//console logging on desktop
function swLog(...args) {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({ type: "log", msg: args.map(a => String(a)).join(" ") });
        });
    });
}

//install event: optional, can pre-cache static assets if needed
self.addEventListener("install", (event) => {
    swLog("Installing...");
});

self.addEventListener("activate", (event) => {
    swLog("Activating and cleaning old caches...");

    event.waitUntil(
        (async () => {
            //delete old caches
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
        event.respondWith(handleAudioStream(event.request));
    }
});


async function handleAudioStream(request) {
    const cache = await caches.open(CACHE_NAME);

    //check for cache hit
    let cachedResponse = await cache.match(request);
    if (cachedResponse) {
        //serve cached response immediately
        return cachedResponse;
    }

    //fetch from network
    const networkResponse = await fetch(request);
    if (!networkResponse.ok) return networkResponse;

    //split network stream: one for caching, one for immediate playback
    const [streamForCache, streamForAudio] = networkResponse.body.tee();

    //cache stream
    const responseForCache = new Response(streamForCache, {
        headers: networkResponse.headers,
        status: networkResponse.status,
        statusText: networkResponse.statusText,
    });
    cache.put(request, responseForCache).catch((err) =>
        console.error("Failed to cache audio:", err)
    );

    // Serve the audio stream immediately
    return new Response(streamForAudio, {
        headers: networkResponse.headers,
        status: networkResponse.status,
        statusText: networkResponse.statusText,
    });
}

