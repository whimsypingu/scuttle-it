import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA} from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'url'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		visualizer({ open: true, filename: "bundle-analysis.html", template: "treemap", gzipSize: true, brotliSize: true }),
		VitePWA({
			strategies: 'injectManifest',
			srcDir: 'src',
			filename: 'sw.js',
			registerType: 'autoUpdate',
			injectRegister: false,
			injectManifest: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
			},
		})
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
