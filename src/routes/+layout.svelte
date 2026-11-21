<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { navigating } from '$app/state';
	import { afterNavigate, goto } from '$app/navigation';
	import { feeds } from '#lib/hn';
	import { feedPath, recentPosition } from '#lib/reading-position';
	import { initSavedStories } from '#lib/saved';
	import { setAnalyticsEnabled, trackPage } from '#lib/analytics';
	import AnalyticsPrivacy from '#lib/components/AnalyticsPrivacy.svelte';
	import { tagline, productName, productQualifier } from '#lib/branding';
	import AppearancePicker from '#lib/components/AppearancePicker.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import AmbientRain from '#lib/components/AmbientRain.svelte';
	let { data, children } = $props();
	let compactHeader = $state(false);
	let newBuild = $state('');
	let moreFeeds: HTMLDetailsElement | undefined = $state();
	let moreTrigger: HTMLElement | undefined = $state();
	const mainFeeds = feeds.slice(0, 3);
	const otherFeeds = feeds.slice(3);
	const activeOverflow = $derived(otherFeeds.find(({ id }) => page.url.pathname === feedPath(id)));

	function closeFeeds() {
		if (moreFeeds?.open) moreFeeds.open = false;
	}

	function dismissFeeds(event: PointerEvent) {
		if (event.target instanceof Node && !moreFeeds?.contains(event.target)) closeFeeds();
	}

	function escapeFeeds(event: KeyboardEvent) {
		if (!moreFeeds?.open || event.key !== 'Escape') return;
		event.preventDefault();
		closeFeeds();
		moreTrigger?.focus();
	}

	afterNavigate(() => {
		closeFeeds();
		setAnalyticsEnabled(data.analyticsAvailable && data.analyticsChoice === 'yes');
		trackPage(page.url.pathname, page.route.id, page.params.feed);
	});
	const onFeed = $derived(feeds.some(({ id }) => page.url.pathname === feedPath(id)));

	function reloadBuild(automatic = false) {
		if (!newBuild) return;
		try {
			if (automatic && sessionStorage.getItem('whn-build-reload') === newBuild) return;
			sessionStorage.setItem('whn-build-reload', newBuild);
		} catch {
			// An automatic reload is only safe when its loop guard can be saved.
			if (automatic) return;
		}
		const url = new URL(window.location.href);
		if (onFeed && scrollY > 24 && !url.searchParams.has('page'))
			url.searchParams.set('launch', '1');
		window.location.replace(url);
	}
	onMount(() => {
		const update = () => {
			// Separate thresholds keep the header stable while its height changes.
			compactHeader = window.scrollY > (compactHeader ? 24 : 144);
		};
		const disposeSaved = initSavedStories();
		const launch = page.url.searchParams.get('launch') === '1';
		const standalone =
			matchMedia('(display-mode: standalone)').matches ||
			(navigator as Navigator & { standalone?: boolean }).standalone === true;
		const savedPosition = recentPosition();
		const savedPath = savedPosition && feedPath(savedPosition.feed);
		const legacyLaunch =
			standalone &&
			page.url.pathname === '/' &&
			!page.url.search &&
			(savedPath !== '/' || !!savedPosition?.anchors.length);
		if (savedPath && (launch ? page.url.pathname !== savedPath : legacyLaunch))
			void goto(`${savedPath}?launch=1`, { replaceState: true });

		const buildKey = (build: typeof data.build) => `${build.revision}:${build.builtAt}`;
		const loadedBuild = buildKey(data.build);
		let checking = false;
		let recheck = false;
		let disposed = false;
		async function checkBuild() {
			if (document.hidden || disposed) return;
			if (checking) {
				recheck = true;
				return;
			}
			checking = true;
			try {
				const response = await fetch('/api/version', {
					cache: 'no-store',
					signal: AbortSignal.timeout(8000)
				});
				if (!response.ok) return;
				const latest = (await response.json()) as typeof data.build;
				if (
					disposed ||
					document.hidden ||
					typeof latest.revision !== 'string' ||
					typeof latest.builtAt !== 'string'
				)
					return;
				const key = buildKey(latest);
				if (key === loadedBuild) return;
				newBuild = key;
				if (
					standalone &&
					onFeed &&
					scrollY <= 24 &&
					!navigating.to &&
					!document.querySelector('dialog[open], [data-refreshable][aria-busy="true"]')
				) {
					reloadBuild(true);
				}
			} catch {
				// A version check must never interrupt reading.
			} finally {
				checking = false;
				if (recheck) {
					recheck = false;
					void checkBuild();
				}
			}
		}

		update();
		void checkBuild();
		window.addEventListener('scroll', update, { passive: true });
		document.addEventListener('visibilitychange', checkBuild);
		return () => {
			disposed = true;
			disposeSaved();
			window.removeEventListener('scroll', update);
			document.removeEventListener('visibilitychange', checkBuild);
		};
	});
</script>

<svelte:head
	><meta
		name="description"
		content="A fresh perspective on Hacker News. Read the stories, ideas, and conversations that matter — in your own style."
	/></svelte:head
>
<svelte:window onpointerdown={dismissFeeds} onkeydown={escapeFeeds} />

{#snippet feedLink(feed: (typeof feeds)[number], className = '')}
	<a
		class={className}
		href={feedPath(feed.id)}
		aria-current={page.url.pathname === feedPath(feed.id) ? 'page' : undefined}
		onclick={closeFeeds}>{feed.name}</a
	>
{/snippet}

<AmbientRain enabled={data.motion} />
<a class="skip-link" href="#main">Skip to content</a>
<div class="site-shell">
	<header class="site-header" class:compact-header={compactHeader}>
		<div class="brand-row">
			<div class="brand-inner">
				<a class="brand" href="/" aria-label={`${tagline} home`}
					><img class="brand-mark" src="/favicon.svg" width="48" height="48" alt="" /><span
						>{productName}<span class="brand-sub">{productQualifier}</span></span
					></a
				>
			</div>
		</div>
		<nav aria-label="Feeds">
			{#each mainFeeds as feed}
				{@render feedLink(feed)}
			{/each}
			{#each otherFeeds as feed}
				{@render feedLink(feed, 'wide-feed')}
			{/each}
			<details bind:this={moreFeeds} class="feed-overflow" class:current={!!activeOverflow}>
				<summary
					bind:this={moreTrigger}
					aria-label={activeOverflow ? `More feeds, ${activeOverflow.name} selected` : 'More feeds'}
					title="More feeds"
				>
					<Icon name="ellipsis" size={20} />
				</summary>
				<div class="feed-overflow-panel">
					{#each otherFeeds as feed}
						{@render feedLink(feed)}
					{/each}
				</div>
			</details>
		</nav>
		<div class="header-actions">
			<a
				class="appearance-button saved-shortcut"
				href="/saved"
				aria-label="Saved"
				title="Saved"
				aria-current={page.url.pathname === '/saved' ? 'page' : undefined}
			>
				<Icon name="bookmark" size={20} />
			</a>
			<AppearancePicker
				accents={data.accents}
				fontSize={data.fontSize}
				density={data.density}
				motion={data.motion}
				theme={data.theme}
				appearance={data.appearance}
				returnTo={page.url.pathname + page.url.search}
			/>
		</div>
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
			><a href="https://github.com/fini/warped-hacker-news">Source on GitHub</a>
			{#if data.analyticsAvailable}
				<AnalyticsPrivacy
					choice={data.analyticsChoice}
					returnTo={page.url.pathname + page.url.search}
				/>
			{/if}
			<small title={data.build.builtAt}
				>Build {data.build.revision} · {data.build.builtAt.slice(0, 10)}</small
			>
		</div>
	</footer>
</div>

{#if newBuild}
	<div class="reader-notice build-notice">
		<button class="primary" type="button" onclick={() => reloadBuild()}
			>Update available · Reload</button
		>
	</div>
{/if}
