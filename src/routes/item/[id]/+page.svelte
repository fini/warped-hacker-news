<script lang="ts">
	import { page } from '$app/state';
	import { age, domain, safeUrl } from '#lib/hn';
	import CommentList from '#lib/components/CommentList.svelte';
	import Icon from '#lib/components/Icon.svelte';
	let { data } = $props();
</script>

<svelte:head><title>{data.item.title ?? 'Discussion'} — Warped Hacker News</title></svelte:head>
<div class="reading-page">
	<a class="back-link" href="/">Back to the front page</a><span class="eyebrow"
		>The conversation</span
	>
	<h1>
		{data.item.title ?? (data.item.type === 'comment' ? 'A thought in the thread' : 'Discussion')}
	</h1>
	<div class="story-meta">
		<span>{data.item.score ?? 0} points</span>{#if data.item.by}<span>·</span><a
				href={`/user/${data.item.by}`}>{data.item.by}</a
			>{/if}<span>·</span><span>{age(data.item.time)}</span>
	</div>
	{#if safeUrl(data.item.url)}<a class="article-link" href={safeUrl(data.item.url)}
			>Read on {domain(data.item.url)} <Icon name="external" size={15} /></a
		>{/if}
	{#if data.item.deleted || data.item.dead}<p class="notice">
			This item is {data.item.deleted ? 'deleted' : 'unavailable'}.
		</p>{:else if data.item.text}<div class="story-body prose">{@html data.item.text}</div>{/if}
	<div class="discussion-heading">
		<h2>{data.item.descendants ?? data.item.kids?.length ?? 0} comments</h2>
		<a href={`https://news.ycombinator.com/item?id=${data.item.id}`}
			>Join on Hacker News <Icon name="external" size={13} /></a
		>
	</div>
	{#if data.failed}<p class="notice" role="status">
			Some comments couldn’t be loaded. <a
				href={page.url.pathname + page.url.search}
				data-sveltekit-reload>Retry</a
			>
		</p>{/if}
	{#key data.item.id}<CommentList
			parent={data.item.id}
			initial={data.comments}
			offset={15}
			hasMore={data.remaining.length > 0}
		/>{/key}
	{#if !data.item.kids?.length}<p class="empty-comments">
			A good conversation starts somewhere. Be the first on Hacker News.
		</p>{/if}
</div>
