<script lang="ts">
	import { siteTitle } from '#lib/branding';
	import { page } from '$app/state';
</script>

<svelte:head><title>{page.status} — {siteTitle}</title></svelte:head>
<div class="reading-page">
	<span class="eyebrow">{page.status}</span>
	<h1>A detour in the signal.</h1>
	<p>{page.error?.message ?? 'Something went wrong.'}</p>
	<a class="primary" href="/">Back to the front page</a>
</div>
