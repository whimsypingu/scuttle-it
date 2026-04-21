import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// // --- SW registration ---
// if ("serviceWorker" in navigator) {
// 	console.log("Service worker in navigator");
// 	window.addEventListener("load", () => {
// 		navigator.serviceWorker.register("/sw.js") //found in public/sw.js
// 			.then(reg => console.log("SW registered: ", reg.scope))
// 			.catch(err => console.error("SW registration failed: ", err));

// 		navigator.serviceWorker.addEventListener("message", (event) => {
// 			if (event.data?.type === "log") {
// 				console.log("[SW]", event.data.msg);
// 			}
// 		});
// 	});
// } else {
// 	console.log("Service worker not found in navigator");
// }

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
