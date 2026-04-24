import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// --- SW registration ---
if ("serviceWorker" in navigator) {
    console.log("%c[SW] Service worker in navigator", "color: #ff9800; font-weight: bold;");

    const register = async () => {
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
        } catch (err) {
            console.error(`%c[SW] registration failed: ${err}`, "color: #ff9800; font-weight: bold;");
        }
    };

    // If the page is already loaded, register now. Otherwise, wait for load.
    if (document.readyState === "complete") {
        register();
    } else {
        window.addEventListener("load", register);
    }
} else {
    console.log("%c[SW] Service worker not supported", "color: #ff9800; font-weight: bold;");
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
