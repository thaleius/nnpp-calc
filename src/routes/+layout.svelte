<script lang="ts">
	import './layout.css';
	// import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
	
	export const prerender = true;
</script>

<!-- <svelte:head><link rel="icon" href={favicon} /></svelte:head> -->
{@render children()}

<style>
	:global(html) {
		background-color: #121212;
		color: #fff;
	}
</style>