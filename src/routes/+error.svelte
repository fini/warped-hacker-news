<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head><title>{page.status} — Warped Hacker News</title></svelte:head>
<div class="reading-page">
	<span class="eyebrow">{page.status}</span>
	<h1>A detour in the signal.</h1>
	<p>{page.error?.message ?? 'Something went wrong.'}</p>
	<a class="primary" href="/">Back to the front page</a>
</div>
