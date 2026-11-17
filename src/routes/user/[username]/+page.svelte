<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	let { data } = $props();
</script>

<svelte:head><title>{data.user.id} — Warped Hacker News</title></svelte:head>
<div class="reading-page profile">
	<a class="back-link" href="/">Back to the front page</a><span class="eyebrow"
		>One of the curious</span
	>
	<h1>{data.user.id}</h1>
	<div class="profile-stats">
		<div><strong>{(data.user.karma ?? 0).toLocaleString()}</strong><span>karma</span></div>
		<div>
			<strong
				>{data.user.created
					? new Date(data.user.created * 1000).toLocaleDateString('en', {
							year: 'numeric',
							month: 'short',
							day: 'numeric',
							timeZone: 'UTC'
						})
					: 'Unknown'}</strong
			><span>joined Hacker News</span>
		</div>
	</div>
	{#if data.user.about}<div class="prose story-body">{@html data.user.about}</div>{:else}<p
			class="muted"
		>
			This reader prefers a little mystery. No biography yet.
		</p>{/if}<a class="article-link" href={`https://news.ycombinator.com/user?id=${data.user.id}`}
		>View on Hacker News <Icon name="external" size={15} /></a
	>
</div>
