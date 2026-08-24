import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// --- SW registration ---
if ("serviceWorker" in navigator) {
    console.log("%c[SW] Service worker in navigator", "color: #ff9800; font-weight: bold;");

    const registerAndCacheInitialStatic = async () => {
        try {
			const swUrl = `/sw.js?v=${Date.now()}`;
            const registration = await navigator.serviceWorker.register(swUrl, {
                scope: "/",
                updateViaCache: "none", // Force browser to check for new SW script
            });
            console.log(`%c[SW] registered with scope: ${registration.scope}`, "color: #ff9800; font-weight: bold;");

            // Listen for logs from the SW
            navigator.serviceWorker.addEventListener("message", (event) => {
                if (event.data?.type === "log") {
                    console.log(`%c[SW]%c ${event.data.msg}`, "color: #ff9800; font-weight: bold;", "color: inherit;");
                }
            });

            //scrape loaded scripts and links
            const elements = Array.from(
                document.querySelectorAll<HTMLElement>("script[src], link[href]") //get <script> and <link> tags with srcs and hrefs
            );
            const targetPrecacheUrls = elements
                .map((el) => {
                    if ("src" in el && typeof (el as HTMLScriptElement).src === "string") return (el as HTMLScriptElement).src; //resolve full url
                    if ("href" in el && typeof (el as HTMLLinkElement).href === "string") return (el as HTMLLinkElement).href;
                    return null;
                })
                .filter((url): url is string => { //typecast from output of type (string | null)[] to just string[] for cache.addAll
                    if (!url) return false;
                    
                    try {
                        const parsed = new URL(url);
                        const isStatic = 
                            parsed.pathname.startsWith("/assets") || 
                            parsed.pathname.startsWith("/static");

                        return isStatic;
                    } catch {
                        return false; //url was malformed and failed to parse to type URL
                    }
                });

            const precacheUrls = Array.from(
                new Set([
                    "/",
                    "/index.html",
                    "/manifest.json",
                    "/static/defaultMediaSessionLogo.png",
                    ...targetPrecacheUrls
                ])
            );

            console.log("PRECACHE URLS");
            console.log(precacheUrls);

            const readyRegistration = await navigator.serviceWorker.ready;
            const targetWorker = navigator.serviceWorker.controller || readyRegistration.active;

            if (targetWorker) {
                targetWorker.postMessage({
                    type: "INITIAL_STATIC_PRECACHE",
                    payload: precacheUrls,
                });
            }

        } catch (err) {
            console.error(`%c[SW] registration and precache failed: ${err}`, "color: #ff9800; font-weight: bold;");
        }
    };

    // If the page is already loaded, register now. Otherwise, wait for load.
    if (document.readyState === "complete") {
        registerAndCacheInitialStatic();
    } else {
        window.addEventListener("load", registerAndCacheInitialStatic);
    }
} else {
    console.log("%c[SW] Service worker not supported", "color: #ff9800; font-weight: bold;");
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
