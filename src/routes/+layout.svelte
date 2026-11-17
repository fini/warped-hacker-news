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
	import { themes } from '#lib/themes';
	import Icon from '#lib/components/Icon.svelte';
	let { data, children } = $props();
	let settings = $state(false);
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
		<a class="brand" href="/" aria-label="Warped Hacker News home"
			><span class="brand-mark">w.</span><span
				>warped<span class="brand-sub">hacker news, reimagined</span></span
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
		<button
			class="appearance-button"
			disabled={!ready}
			aria-label="Appearance"
			onclick={() => (settings = !settings)}
			aria-expanded={settings}
			aria-controls="appearance"><Icon name="sun" /><span>Appearance</span></button
		>
	</header>
	{#if settings}<section id="appearance" class="appearance-panel" aria-label="Appearance settings">
			<div>
				<span class="eyebrow">Make yourself at home</span>
				<h2>Your news. Your atmosphere.</h2>
			</div>
			<form action="/appearance" method="POST">
				<input type="hidden" name="returnTo" value={page.url.pathname + page.url.search} /><label
					>Theme<select name="theme" value={data.theme}
						>{#each themes as theme}<option value={theme.id}>{theme.name}</option>{/each}</select
					></label
				><label
					>Modern appearance<select name="appearance" value={data.appearance}
						><option value="system">Follow system</option><option value="light">Light</option
						><option value="dark">Dark</option></select
					></label
				><button class="primary" type="submit">Apply appearance <Icon name="arrow" /></button>
			</form>
		</section>{/if}
	<div class="theme-ornament" aria-hidden="true"></div>
	{#if navigating.to}<div class="navigation-progress" role="status">Loading stories…</div>{/if}
	<main id="main" tabindex="-1">{@render children()}</main>
	<footer class="site-footer">
		<div>
			<a class="footer-brand" href="/">warped.</a><span
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
