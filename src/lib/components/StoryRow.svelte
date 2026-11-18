<script lang="ts">
	import { age, domain, safeUrl, type Item } from '#lib/hn';
	import Icon from './Icon.svelte';
	let { item, rank }: { item: Item; rank: number } = $props();
	const source = $derived(domain(item.url));
	const commentCount = $derived(item.descendants ?? 0);
	const commentLabel = $derived(`${commentCount} comments on ${item.title ?? 'Untitled'}`);
</script>

<article class="story-row" id={`story-${item.id}`}>
	<span class="story-rank">{String(rank).padStart(2, '0')}</span>
	<div class="story-content">
		<div class="story-heading">
			<h2><a href={safeUrl(item.url) ?? `/item/${item.id}`}>{item.title ?? 'Untitled'}</a></h2>
			{#if source}<span class="story-domain">{source} <Icon name="external" size={11} /></span>{/if}
		</div>
		<div class="story-meta">
			<span class="points">{item.score ?? 0} points</span><span class="meta-dot">·</span
			>{#if item.by}<a href={`/user/${item.by}`}>{item.by}</a><span class="meta-dot">·</span>{/if}<a
				href={`/item/${item.id}`}>{age(item.time)}</a
			>
			<span class="meta-dot compact-meta" aria-hidden="true">·</span>
			<a class="compact-meta" href={`/item/${item.id}`} aria-label={commentLabel}>
				{commentCount}
				{commentCount === 1 ? 'comment' : 'comments'}
			</a>
			{#if source}
				<span class="meta-dot compact-meta" aria-hidden="true">·</span>
				<span class="compact-meta">{source}</span>
			{/if}
		</div>
	</div>
	<a class="comment-count" href={`/item/${item.id}`} aria-label={commentLabel}
		><strong>{commentCount}</strong><span>comments</span></a
	>
</article>
