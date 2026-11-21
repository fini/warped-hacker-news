<script lang="ts">
	import type { Item } from '#lib/hn';
	import { savedStories, toggleSaved } from '#lib/saved';
	import Icon from './Icon.svelte';
	let { item, showText = false }: { item: Pick<Item, 'id' | 'title' | 'url'>; showText?: boolean } =
		$props();
	let error = $state(false);
	const saved = $derived($savedStories.stories.some(({ id }) => id === item.id));
	const action = $derived(saved ? 'Remove from Saved' : 'Save for later');
</script>

<button
	type="button"
	class="save-story"
	aria-label={`${action}: ${item.title ?? 'Untitled'}`}
	title={action}
	aria-pressed={saved}
	disabled={!$savedStories.ready}
	onclick={() => {
		error = false;
		try {
			toggleSaved(item);
		} catch {
			error = true;
		}
	}}
	><Icon name={saved ? 'bookmark-filled' : 'bookmark'} size={16} />{#if showText}<span
			>{action}</span
		>{/if}</button
>
{#if error}<span class="inline-error" role="status">Couldn’t update Saved on this device.</span
	>{/if}
