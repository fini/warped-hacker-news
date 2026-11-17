<script lang="ts">
	import { age, type Item } from '#lib/hn';
	import CommentList from './CommentList.svelte';
	let { item, depth = 0 }: { item: Item; depth?: number } = $props();
	let open = $state(true);
</script>

<article class="comment" id={`comment-${item.id}`}>
	<header>
		<button
			class="collapse-button"
			onclick={() => (open = !open)}
			aria-expanded={open}
			aria-label={`${open ? 'Collapse' : 'Expand'} comment by ${item.by ?? 'deleted user'}`}
			>{open ? '−' : '+'}</button
		>{#if item.by}<a class="comment-author" href={`/user/${item.by}`}>{item.by}</a>{:else}<span
				>deleted user</span
			>{/if}<a href={`/item/${item.id}`}>{age(item.time)}</a>{#if !open}<span>collapsed</span>{/if}
	</header>
	{#if open}<div class="comment-body prose">
			{#if item.deleted || item.dead}<p class="muted">
					[{item.deleted ? 'deleted' : 'unavailable'}]
				</p>{:else}{@html item.text ?? ''}{/if}
		</div>
		{#if item.kids?.length}{#if depth < 8}<div class="comment-children">
					<CommentList parent={item.id} depth={depth + 1} />
				</div>{:else}<a class="thread-link" href={`/item/${item.id}`}>Continue this thread →</a
				>{/if}{/if}{/if}
</article>
