<script lang="ts">
	import { siteTitle } from '#lib/branding';
	import { page } from '$app/state';
	import { snapshot } from '$app/navigation';
	import { untrack, tick } from 'svelte';
	import type { Item } from '#lib/hn';
	import StoryRow from './StoryRow.svelte';
	import Icon from './Icon.svelte';
	let {
		data
	}: {
		data: {
			feed: { id: string; name: string; description: string };
			page: number;
			items: Item[];
			ids: number[];
			total: number;
			failed: number;
			hasMore: boolean;
			failure: string;
		};
	} = $props();

	let stories = $state<Item[]>(untrack(() => data.items));
	let ids = $state<number[]>(untrack(() => data.ids));
	let cursor = $state(untrack(() => data.page * 30));
	let pending = $state(false);
	let failure = $state('');
	let message = $state('');
	const ranks = $derived(new Map(ids.map((id, index) => [id, index + 1])));
	snapshot({
		id: untrack(() => `feed-${data.feed.id}-${data.page}`),
		capture: () => ({ stories, ids, cursor, failure, message }),
		restore: (saved) => {
			stories = saved.stories;
			ids = saved.ids;
			cursor = saved.cursor;
			failure = saved.failure;
			message = saved.message;
		}
	});
	async function loadMore(event: MouseEvent) {
		if (pending || cursor >= ids.length) return;
		pending = true;
		failure = '';
		message = '';
		const batch = ids.slice(cursor, cursor + 30);
		try {
			const response = await fetch(`/api/stories?ids=${batch.join(',')}`, {
				signal: AbortSignal.timeout(45000)
			});
			if (!response.ok) throw new Error('unavailable');
			const result: { items: Item[]; failed: number } = await response.json();
			const existing = new Map(stories.map((item) => [item.id, item]));
			const added = result.items.filter((item) => !existing.has(item.id));
			for (const item of result.items) existing.set(item.id, item);
			const scroll = window.scrollY;
			stories = [...existing.values()].sort(
				(a, b) => (ranks.get(a.id) ?? 0) - (ranks.get(b.id) ?? 0)
			);
			if (result.failed) failure = 'Some stories couldn’t be loaded. Retry to finish this batch.';
			else cursor += batch.length;
			message = `Added ${added.length} ${added.length === 1 ? 'story' : 'stories'}.`;
			await tick();
			window.scrollTo({ top: scroll, behavior: 'instant' });
			if (event.detail === 0 && added.length)
				document
					.querySelector<HTMLElement>(`#story-${added[0].id} h2 a`)
					?.focus({ preventScroll: true });
		} catch {
			failure = 'Couldn’t load more stories. Please try again.';
		} finally {
			pending = false;
		}
	}
</script>

<svelte:head><title>{data.feed.name} stories — {siteTitle}</title></svelte:head>
<section class="feed-intro">
	<div>
		<span class="eyebrow"><span class="status-dot"></span> A signal worth following</span>
		<h1>
			{data.feed.id === 'top'
				? 'Stay curious.'
				: data.feed.name === 'New'
					? 'Just landed.'
					: data.feed.name === 'Best'
						? 'Worth your time.'
						: data.feed.name === 'Ask HN'
							? 'Ask anything.'
							: data.feed.name === 'Show HN'
								? 'Made by humans.'
								: 'What’s next?'}
		</h1>
		<p>{data.feed.description}</p>
	</div>
	<div class="intro-aside">
		<Icon name="spark" size={28} /><span>Ideas travel.<br />Follow the interesting ones.</span>
	</div>
</section>
<section class="feed-section" aria-label={`${data.feed.name} stories`}>
	<div class="list-heading">
		<h2>{data.feed.name === 'Top' ? 'The front page' : data.feed.name}</h2>
		<span>{stories.length} of {ids.length} stories</span>
	</div>
	{#if data.failure}<div class="notice failure" role="alert">
			<h2>A little turbulence.</h2>
			<p>{data.failure}</p>
			<a class="primary" href={page.url.pathname + page.url.search} data-sveltekit-reload
				>Try again <Icon name="arrow" /></a
			>
		</div>{:else}
		{#if data.failed}<p class="notice" role="status">
				Some stories couldn’t be loaded. <a
					href={page.url.pathname + page.url.search}
					data-sveltekit-reload>Retry loading stories</a
				>
			</p>{/if}
		{#each stories as item (item.id)}<StoryRow {item} rank={ranks.get(item.id) ?? 0} />{:else}<div
				class="notice"
			>
				<h2>You’ve reached the quiet part.</h2>
				<p>
					No stories here. <a href={data.feed.id === 'top' ? '/' : `/${data.feed.id}`}
						>Back to the latest stories</a
					>
				</p>
			</div>{/each}
	{/if}
	<div class="load-more" aria-busy={pending}>
		<span
			>{data.failure
				? 'Try loading the feed again.'
				: cursor < ids.length
					? 'Curiosity doesn’t stop here.'
					: 'You’re all caught up.'}</span
		>
		{#if cursor < ids.length}
			<button class="primary" onclick={loadMore} disabled={pending}>
				{pending ? 'Loading stories…' : failure ? 'Retry stories' : 'More stories'}
				<Icon name="arrow" />
			</button>
		{/if}
		<p class="load-feedback" role="status">{failure || message}</p>
	</div>
</section>
