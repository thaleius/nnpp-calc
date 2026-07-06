<script lang="ts">
	import './layout.css';
	// import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<!-- <link rel="icon" href={favicon} /> -->
	<title>Turbine Calculator</title>
</svelte:head>
{@render children()}

<style>
	:global(html) {
		background-color: #121212;
		color: #fff;
	}
</style>