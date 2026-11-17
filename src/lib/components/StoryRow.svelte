<script lang="ts">
	import { age, domain, safeUrl, type Item } from '#lib/hn';
	import Icon from './Icon.svelte';
	let { item, rank }: { item: Item; rank: number } = $props();
</script>

<article class="story-row">
	<span class="story-rank">{String(rank).padStart(2, '0')}</span>
	<div class="story-content">
		<div class="story-heading">
			<h2><a href={safeUrl(item.url) ?? `/item/${item.id}`}>{item.title ?? 'Untitled'}</a></h2>
			{#if domain(item.url)}<span class="story-domain"
					>{domain(item.url)} <Icon name="external" size={11} /></span
				>{/if}
		</div>
		<div class="story-meta">
			<span class="points">{item.score ?? 0} points</span><span class="meta-dot">·</span
			>{#if item.by}<a href={`/user/${item.by}`}>{item.by}</a><span class="meta-dot">·</span>{/if}<a
				href={`/item/${item.id}`}>{age(item.time)}</a
			>
		</div>
	</div>
	<a
		class="comment-count"
		href={`/item/${item.id}`}
		aria-label={`${item.descendants ?? 0} comments on ${item.title}`}
		><strong>{item.descendants ?? 0}</strong><span>comments</span></a
	>
</article>
