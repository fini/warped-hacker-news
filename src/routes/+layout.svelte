<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { navigating } from '$app/state';
	import { feeds } from '#lib/hn';
	import { tagline, productName, productQualifier } from '#lib/branding';
	import AppearancePicker from '#lib/components/AppearancePicker.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import AmbientRain from '#lib/components/AmbientRain.svelte';
	let { data, children } = $props();
	let compactHeader = $state(false);
	onMount(() => {
		const update = () => {
			// Separate thresholds keep the header stable while its height changes.
			compactHeader = window.scrollY > (compactHeader ? 24 : 144);
		};
		update();
		window.addEventListener('scroll', update, { passive: true });
		return () => window.removeEventListener('scroll', update);
	});
</script>

<svelte:head
	><meta
		name="description"
		content="A fresh perspective on Hacker News. Read the stories, ideas, and conversations that matter — in your own style."
	/></svelte:head
>
<AmbientRain enabled={data.motion} />
<a class="skip-link" href="#main">Skip to content</a>
<div class="site-shell">
	<header class="site-header" class:compact-header={compactHeader}>
		<div class="brand-row">
			<div class="brand-inner">
				<a class="brand" href="/" aria-label={`${tagline} home`}
					><span class="brand-mark">hn.</span><span
						>{productName}<span class="brand-sub">{productQualifier}</span></span
					></a
				>
			</div>
		</div>
		<nav aria-label="Feeds">
			{#each feeds as feed}<a
					href={feed.id === 'top' ? '/' : `/${feed.id}`}
					aria-current={(
						feed.id === 'top' ? page.url.pathname === '/' : page.url.pathname === `/${feed.id}`
					)
						? 'page'
						: undefined}>{feed.name}</a
				>{/each}
		</nav>
		<AppearancePicker
			accents={data.accents}
			fontSize={data.fontSize}
			density={data.density}
			motion={data.motion}
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
