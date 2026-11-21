<script lang="ts">
	import { siteTitle } from '#lib/branding';
	import SaveStory from '#lib/components/SaveStory.svelte';
	import { savedStories } from '#lib/saved';
</script>

<svelte:head><title>Saved — {siteTitle}</title></svelte:head>
<div class="reading-page">
	<h1>Saved</h1>
	<p class="saved-description">Stories you’ve saved on this device.</p>
	{#if !$savedStories.ready}
		<p role="status">Loading saved stories…</p>
	{:else if !$savedStories.available}
		<p class="notice" role="status">Saved stories aren’t available on this device.</p>
	{:else if !$savedStories.stories.length}
		<p class="notice">No saved stories yet. Use the bookmark button on a story to save it here.</p>
	{:else}
		<ul class="saved-list">
			{#each $savedStories.stories as story (story.id)}
				<li>
					<div>
						<h2><a href={story.url ?? `/item/${story.id}`}>{story.title}</a></h2>
						<a class="saved-discussion" href={`/item/${story.id}`}>Discussion</a>
					</div>
					<SaveStory item={story} />
				</li>
			{/each}
		</ul>
	{/if}
</div>
