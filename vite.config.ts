import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tailwindAutoReference from 'vite-plugin-svelte-tailwind-auto-reference';

export default defineConfig({
	plugins: [
		tailwindcss(),
		tailwindAutoReference(),
		sveltekit()
	]
});
