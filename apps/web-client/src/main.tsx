import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// --- SW registration ---
if ("serviceWorker" in navigator) {
    console.log("[SW] Service worker in navigator");

    const register = async () => {
        try {
			const swUrl = `/sw.js?v=${Date.now()}`;
            const registration = await navigator.serviceWorker.register(swUrl, {
                scope: "/",
                updateViaCache: "none", // Force browser to check for new SW script
            });
            console.log("[SW] registered with scope:", registration.scope);

            // Listen for logs from the SW
            navigator.serviceWorker.addEventListener("message", (event) => {
                if (event.data?.type === "log") {
                    console.log(event.data.msg, "(Echo)");
                }
            });
        } catch (err) {
            console.error("[SW] registration failed:", err);
        }
    };

    // If the page is already loaded, register now. Otherwise, wait for load.
    if (document.readyState === "complete") {
        register();
    } else {
        window.addEventListener("load", register);
    }
} else {
    console.log("[SW] Service worker not supported");
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
