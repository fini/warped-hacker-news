<script lang="ts">
	import { onMount } from 'svelte';
	let ready = $state(false);
	onMount(() => {
		ready = true;
	});
	import { untrack } from 'svelte';
	import type { Item } from '#lib/hn';
	import Comment from './Comment.svelte';
	import Icon from './Icon.svelte';
	let {
		parent,
		initial = [],
		offset = 0,
		hasMore = true,
		depth = 0
	}: {
		parent: number;
		initial?: Item[];
		offset?: number;
		hasMore?: boolean;
		depth?: number;
	} = $props();
	let extra = $state<Item[]>([]);
	let next = $state(untrack(() => offset));
	let more = $state(untrack(() => hasMore));
	let pending = $state(false);
	let failure = $state('');
	let partial = $state(false);
	async function load() {
		if (pending) return;
		pending = true;
		failure = '';
		try {
			const response = await fetch(`/api/comments/${parent}?offset=${next}`);
			if (!response.ok) throw new Error();
			const result = await response.json();
			if (result.failed) {
				partial = true;
				failure = 'Some replies could not be loaded. Retry to recover them.';
				extra = [...extra, ...result.items.filter((i: Item) => !extra.some((e) => e.id === i.id))];
			} else {
				partial = false;
				extra = [...extra, ...result.items.filter((i: Item) => !extra.some((e) => e.id === i.id))];
				next = result.nextOffset;
				more = result.hasMore;
			}
		} catch {
			failure = 'Couldn’t load replies. Please try again.';
		} finally {
			pending = false;
		}
	}
</script>

<div class="comments-list">
	{#each [...initial, ...extra] as comment (comment.id)}<Comment item={comment} {depth} />{/each}
</div>
{#if more}<div class="load-comments">
		<button class="secondary" onclick={load} disabled={pending || !ready} aria-busy={pending}
			>{pending
				? 'Loading replies…'
				: failure
					? 'Retry replies'
					: initial.length + extra.length === 0
						? 'Load replies'
						: 'Load more comments'}
			<Icon name="chevron" size={14} /></button
		>{#if failure}<p class="inline-error" role="alert">{failure}</p>{/if}{#if partial}<small
				>Replies already loaded are preserved.</small
			>{/if}
	</div>{/if}
