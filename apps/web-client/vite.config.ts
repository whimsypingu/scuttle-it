import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { fileURLToPath, URL } from 'url'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		visualizer({ open: true, filename: "bundle-analysis.html", template: "treemap", gzipSize: true, brotliSize: true })
	],
	build: {
		sourcemap: true,
		rollupOptions: {
			treeshake: {
				moduleSideEffects: false
			}
		}
	},
	optimizeDeps: {
		include: ["@phosphor-icons/react"],
	},
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url))
		}
	},
	server: {
		allowedHosts: ['.trycloudflare.com'],
		watch: {
			ignored: ['**/node_modules/**', '**/dist/**', '**/assets/**'],
		}
	}
})
