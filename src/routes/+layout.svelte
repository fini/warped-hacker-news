<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	let ready = $state(false);
	onMount(() => {
		ready = true;
	});
	import { page } from '$app/state';
	import { navigating } from '$app/state';
	import { feeds } from '#lib/hn';
	import { tagline, productName, productQualifier } from '#lib/branding';
	import AppearancePicker from '#lib/components/AppearancePicker.svelte';
	import Icon from '#lib/components/Icon.svelte';
	let { data, children } = $props();
	let menu = $state(false);
</script>

<svelte:head
	><meta
		name="description"
		content="A fresh perspective on Hacker News. Read the stories, ideas, and conversations that matter — in your own style."
	/></svelte:head
>
<a class="skip-link" href="#main">Skip to content</a>
<div class="site-shell">
	<header class="site-header">
		<a class="brand" href="/" aria-label={`${tagline} home`}
			><span class="brand-mark">hn.</span><span
				>{productName}<span class="brand-sub">{productQualifier}</span></span
			></a
		>
		<button
			class="icon-button mobile-menu"
			disabled={!ready}
			aria-label="Toggle navigation"
			aria-expanded={menu}
			onclick={() => (menu = !menu)}><Icon name={menu ? 'close' : 'menu'} /></button
		>
		<nav class:open={menu} aria-label="Feeds">
			{#each feeds as feed}<a
					href={feed.id === 'top' ? '/' : `/${feed.id}`}
					aria-current={(
						feed.id === 'top' ? page.url.pathname === '/' : page.url.pathname === `/${feed.id}`
					)
						? 'page'
						: undefined}
					onclick={() => (menu = false)}>{feed.name}</a
				>{/each}
		</nav>
		<AppearancePicker
			theme={data.theme}
			appearance={data.appearance}
			returnTo={page.url.pathname + page.url.search}
		/>
	</header>
	<div class="theme-ornament" aria-hidden="true"></div>
	{#if navigating.to}<div class="navigation-progress" role="status">Loading stories…</div>{/if}
	<main id="main" tabindex="-1">{@render children()}</main>
	<footer class="site-footer">
		<div>
			<a class="footer-brand" href="/">{tagline}</a><span
				>A different lens. The same curious community.</span
			>
		</div>
		<div>
			<a href="https://news.ycombinator.com" target="_blank" rel="noreferrer"
				>Powered by Hacker News <Icon name="external" size={13} /></a
			><a href="https://github.com/fini/warped-hacker-news">Source on GitHub</a><small
				title={data.build.builtAt}
				>Build {data.build.revision} · {data.build.builtAt.slice(0, 10)}</small
			>
		</div>
	</footer>
</div>
