/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],

	// The app is served from a subpath on GitHub Pages
	// (https://bwwhitaker.github.io/cloaked/), so assets must resolve relative
	// to /cloaked/ in production. Dev still serves from /.
	base: '/cloaked/',

	server: {
		port: 3000,
		open: true,
	},

	build: {
		// Keep CRA's output folder name so `gh-pages -d build` still works.
		outDir: 'build',
	},

	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/setupTests.js',
		include: ['src/**/*.{test,spec}.{js,jsx}'],
	},
});
