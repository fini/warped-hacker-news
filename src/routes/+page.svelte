<script lang="ts">
	import Feed from '#lib/components/Feed.svelte';
	let { data } = $props();
</script>

{#key `${data.feed.id}:${data.page}`}
	<Feed {data} />
{/key}
