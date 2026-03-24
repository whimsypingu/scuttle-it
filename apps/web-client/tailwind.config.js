/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
		colors: {
			brand: {
			DEFAULT: '#E50914',
			hover: '#B20710',
			},
			surface: '#121212',
			panel: '#181818',
		}
		},
	},
	plugins: [],
}