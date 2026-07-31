<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	// import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
  
	onMount(() => {
    const loader = document.getElementById('initial-loader');
    if (loader) {
      loader.style.opacity = '0';
			loader.style.pointerEvents = 'none';
			
		setTimeout(() => {
			loader.remove();
		}, 500);
    }
  });
</script>

<svelte:head>
	<!-- <link rel="icon" href={favicon} /> -->
	<title>Calculator</title>
</svelte:head>

{@render children()}

<style>
	:global(html) {
		background-color: #121212;
		color: #fff;
	}
</style>
