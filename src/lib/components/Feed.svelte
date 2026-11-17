<script lang="ts">
	import { page } from '$app/state';
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
			total: number;
			failed: number;
			hasMore: boolean;
			failure: string;
		};
	} = $props();
</script>

<svelte:head><title>{data.feed.name} stories — Warped Hacker News</title></svelte:head>
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
		<span>{data.total > 0 ? `${data.total} stories · ` : ''}Page {data.page}</span>
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
					data-sveltekit-reload>Retry this page</a
				>
			</p>{/if}
		{#each data.items as item, index (item.id)}<StoryRow
				{item}
				rank={(data.page - 1) * 30 + index + 1}
			/>{:else}<div class="notice">
				<h2>You’ve reached the quiet part.</h2>
				<p>
					No stories on this page. <a href={data.feed.id === 'top' ? '/' : `/${data.feed.id}`}
						>Back to the first page</a
					>
				</p>
			</div>{/each}
	{/if}
	<nav class="pagination" aria-label="Pagination">
		{#if data.page > 1}<a href={`?page=${data.page - 1}`} class="previous">Previous page</a
			>{/if}<span>Curiosity doesn’t stop here.</span>{#if data.hasMore}<a
				class="primary"
				href={`?page=${data.page + 1}`}>More stories <Icon name="arrow" /></a
			>{/if}
	</nav>
</section>
