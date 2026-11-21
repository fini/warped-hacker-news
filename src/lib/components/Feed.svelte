<script lang="ts">
	import { siteTitle } from '#lib/branding';
	import { trackAnalytics } from '#lib/analytics';
	import { page } from '$app/state';
	import { beforeNavigate, replaceState, snapshot } from '$app/navigation';
	import { onMount, untrack, tick } from 'svelte';
	import type { Feed, Item } from '#lib/hn';
	import {
		feedPath,
		recentPosition,
		refreshAfter,
		rememberPosition,
		type ReadingPosition
	} from '#lib/reading-position';
	import StoryRow from './StoryRow.svelte';
	import Icon from './Icon.svelte';

	type Batch = {
		items: Item[];
		ids: number[];
		failed: number;
		start: number;
		end: number;
		anchorId?: number;
	};
	let {
		data
	}: {
		data: Batch & {
			feed: { id: Feed; name: string; description: string };
			page: number;
			failure: string;
		};
	} = $props();

	let stories = $state<Item[]>(untrack(() => data.items));
	let ids = $state<number[]>(untrack(() => data.ids));
	let first = $state(untrack(() => data.start));
	let cursor = $state(untrack(() => data.end));
	let feedFailure = $state(untrack(() => data.failure));
	let initialFailed = $state(untrack(() => data.failed));
	let pending = $state<'refresh' | 'earlier' | 'more' | ''>('');
	let failedAction = $state<typeof pending>('');
	let failure = $state('');
	let retryRefresh: (() => Promise<void>) | undefined;
	let message = $state('');
	let newAbove = $state<number[]>([]);
	const pullThreshold = 48;
	let pull = $state(0);
	let pullTop = $state(0);
	let pullRefreshing = $state(false);
	const pullReady = $derived(pull >= pullThreshold);
	let section: HTMLElement;
	const ranks = $derived(new Map(ids.map((id, index) => [id, index + 1])));
	const life = new AbortController();
	let active = $state(false);
	let saveTimer: ReturnType<typeof setTimeout> | undefined;
	let hiddenAt = 0;
	let lastRequest = 0;

	snapshot({
		id: untrack(() => `feed-${data.feed.id}-${data.page}`),
		capture: () => ({ stories, ids, first, cursor, feedFailure, initialFailed, newAbove }),
		restore: (saved) => {
			({ stories, ids, first, cursor, feedFailure, initialFailed, newAbove } = saved);
		}
	});

	function headerBottom() {
		return document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
	}

	function readingPosition(): ReadingPosition {
		const header = headerBottom();
		const row =
			scrollY > 24
				? [...section.querySelectorAll<HTMLElement>('.story-row')].find((el) => {
						const box = el.getBoundingClientRect();
						return box.bottom > header && box.top < innerHeight;
					})
				: undefined;
		const index = row ? stories.findIndex(({ id }) => `story-${id}` === row.id) : -1;
		const anchors =
			index < 0
				? []
				: [
						stories[index].id,
						...stories.slice(index + 1, index + 11).map(({ id }) => id),
						...stories
							.slice(Math.max(0, index - 10), index)
							.reverse()
							.map(({ id }) => id)
					];
		return {
			feed: data.feed.id,
			at: Date.now(),
			anchors,
			offset: row ? row.getBoundingClientRect().top - header : 0,
			ids: [...ids]
		};
	}

	function savePosition() {
		if (!active || pending === 'refresh' || page.url.searchParams.has('launch') || !ids.length)
			return;
		rememberPosition(readingPosition());
	}

	function placeStory(id: number, offset: number) {
		const row = document.getElementById(`story-${id}`);
		if (row) {
			const y = scrollY + row.getBoundingClientRect().top - headerBottom() - offset;
			scrollTo({ top: Math.max(0, y), behavior: 'instant' });
		}
	}

	function requestOptions() {
		return {
			cache: 'no-store' as const,
			signal: AbortSignal.any([life.signal, AbortSignal.timeout(45000)])
		};
	}

	async function fetchFeed(anchors: number[], pageNumber: number) {
		const query = new URLSearchParams({ page: String(pageNumber) });
		if (anchors.length) query.set('anchors', anchors.join(','));
		const response = await fetch(`/api/feed/${data.feed.id}?${query}`, requestOptions());
		if (!response.ok) throw new Error('unavailable');
		return (await response.json()) as Batch;
	}

	async function refresh(position?: ReadingPosition, jump = false, launch = false) {
		if (pending) return;
		pending = 'refresh';
		retryRefresh = () => refresh(position, jump, launch);
		failedAction = '';
		failure = '';
		message = '';
		lastRequest = Date.now();
		try {
			const anchors = position?.anchors ?? [];
			const pageNumber = jump || launch || anchors.length ? 1 : data.page;
			let batch = await fetchFeed(anchors, pageNumber);
			if (anchors.length && !batch.anchorId && batch.start > 0 && !batch.failed)
				batch = await fetchFeed([], 1);
			if (batch.failed) throw new Error('incomplete');
			if (!active) return;
			const previousIds = new Set(position?.ids ?? ids);
			const priorNew = new Set(newAbove);
			let anchorId = batch.anchorId;
			if (!launch && !jump) {
				const current = readingPosition();
				const currentAnchor = current.anchors[0];
				if (
					currentAnchor &&
					currentAnchor !== position?.anchors[0] &&
					!batch.items.some((item) => item.id === currentAnchor)
				) {
					failedAction = 'refresh';
					failure = 'You moved while the feed was refreshing. Refresh again when you’re ready.';
					retryRefresh = () => refresh(readingPosition());
					return;
				}
				if (currentAnchor && batch.items.some((item) => item.id === currentAnchor)) {
					anchorId = currentAnchor;
					position = current;
				}
			}
			const anchorIndex = anchorId ? batch.ids.indexOf(anchorId) : 0;
			newAbove = batch.ids
				.slice(0, anchorIndex)
				.filter((id) => !previousIds.has(id) || priorNew.has(id));
			stories = batch.items;
			ids = batch.ids;
			first = batch.start;
			cursor = batch.end;
			initialFailed = 0;
			feedFailure = '';
			message = 'Feed refreshed.';
			if (!launch && !jump) trackAnalytics('feed_refresh');
			await tick();
			if (!active) return;
			if (anchorId && position) {
				placeStory(anchorId, position.offset);
				// The sticky header can collapse after the first scroll changes its height.
				await new Promise<void>((resolve) =>
					requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
				);
				await Promise.allSettled(
					(document.querySelector('.brand-row')?.getAnimations() ?? []).map(
						(animation) => animation.finished
					)
				);
				if (active) placeStory(anchorId, position.offset);
			} else if (jump || launch || anchors.length) {
				scrollTo({ top: 0, behavior: 'instant' });
			}
		} catch {
			failedAction = 'refresh';
			failure = 'Couldn’t refresh the feed. Try again.';
		} finally {
			pending = '';
			if (active && !failure) savePosition();
		}
	}

	async function loadBatch(event: MouseEvent, earlier = false) {
		const start = earlier ? Math.max(0, first - 30) : cursor;
		const end = earlier ? first : Math.min(ids.length, cursor + 30);
		if (pending || start >= end) return;
		const action = earlier ? 'earlier' : 'more';
		pending = action;
		failedAction = '';
		failure = '';
		message = '';
		try {
			const response = await fetch(
				`/api/stories?ids=${ids.slice(start, end).join(',')}`,
				requestOptions()
			);
			if (!response.ok) throw new Error('unavailable');
			const result: { items: Item[]; failed: number } = await response.json();
			if (!active) return;
			const existing = new Map(stories.map((item) => [item.id, item]));
			const added = result.items.filter((item) => !existing.has(item.id));
			for (const item of result.items) existing.set(item.id, item);
			const scroll = window.scrollY;
			const position = earlier ? readingPosition() : null;
			stories = [...existing.values()].sort(
				(a, b) => (ranks.get(a.id) ?? 0) - (ranks.get(b.id) ?? 0)
			);
			if (result.failed) {
				failedAction = action;
				failure = 'Some stories couldn’t be loaded. Retry to finish this batch.';
			} else if (earlier) first = start;
			else cursor = end;
			if (added.length) trackAnalytics('stories_load', action);
			message = `Added ${added.length} ${added.length === 1 ? 'story' : 'stories'}.`;
			await tick();
			if (!active) return;
			if (position?.anchors[0]) placeStory(position.anchors[0], position.offset);
			else window.scrollTo({ top: scroll, behavior: 'instant' });
			if (event.detail === 0 && added.length)
				document
					.querySelector<HTMLElement>(`#story-${added[0].id} h2 a`)
					?.focus({ preventScroll: true });
		} catch {
			failedAction = action;
			failure = earlier
				? 'Couldn’t load earlier stories. Please try again.'
				: 'Couldn’t load more stories. Please try again.';
		} finally {
			pending = '';
		}
	}

	beforeNavigate(({ to }) => {
		if (!to?.url.searchParams.has('launch')) savePosition();
	});
	$effect(() => {
		if (!active || page.url.searchParams.get('launch') !== '1') return;
		untrack(() => {
			const saved = recentPosition();
			if (saved && page.url.pathname !== feedPath(saved.feed)) return;
			const url = new URL(page.url.href);
			url.searchParams.delete('launch');
			replaceState(url, page.state);
			if (saved?.anchors.length) void refresh(saved, false, true);
		});
	});

	onMount(() => {
		active = true;
		const onScroll = () => {
			if (!saveTimer)
				saveTimer = setTimeout(() => {
					saveTimer = undefined;
					savePosition();
				}, 500);
		};
		const visibility = () => {
			if (document.hidden) {
				hiddenAt = Date.now();
				savePosition();
			} else if (hiddenAt && Date.now() - Math.max(hiddenAt, lastRequest) >= refreshAfter) {
				void refresh(readingPosition());
			}
		};
		let touch: { x: number; y: number } | undefined;
		const touchStart = (event: TouchEvent) => {
			if (
				event.touches.length === 1 &&
				scrollY <= 0 &&
				!pending &&
				!document.querySelector('dialog[open]') &&
				!(event.target as Element)?.closest?.('a, summary, button, input, select, textarea')
			) {
				touch = { x: event.touches[0].clientX, y: event.touches[0].clientY };
				pullTop = headerBottom();
			} else resetPull();
		};
		const touchMove = (event: TouchEvent) => {
			if (!touch) return;
			const finger = event.touches[0];
			if (event.touches.length !== 1 || scrollY > 0) return resetPull();
			const y = finger.clientY - touch.y;
			if (y < -5 || Math.abs(finger.clientX - touch.x) > Math.max(12, y)) return resetPull();
			if (y <= 8) {
				pull = 0;
				return;
			}
			if (event.cancelable) event.preventDefault();
			const distance = y * 0.55;
			pull =
				distance <= pullThreshold
					? distance
					: Math.min(72, pullThreshold + (distance - pullThreshold) * 0.4);
		};
		function resetPull() {
			touch = undefined;
			pull = 0;
		}
		const touchEnd = () => {
			const ready = pullReady && !pending;
			resetPull();
			if (!ready) return;
			pullRefreshing = true;
			void refresh().finally(() => (pullRefreshing = false));
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('pagehide', savePosition);
		document.addEventListener('visibilitychange', visibility);
		window.addEventListener('touchstart', touchStart, { passive: true });
		window.addEventListener('touchmove', touchMove, { passive: false });
		window.addEventListener('touchend', touchEnd);
		window.addEventListener('touchcancel', resetPull);
		return () => {
			active = false;
			life.abort();
			clearTimeout(saveTimer);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('pagehide', savePosition);
			document.removeEventListener('visibilitychange', visibility);
			window.removeEventListener('touchstart', touchStart);
			window.removeEventListener('touchmove', touchMove);
			window.removeEventListener('touchend', touchEnd);
			window.removeEventListener('touchcancel', resetPull);
		};
	});
</script>

<svelte:head><title>{data.feed.name} stories — {siteTitle}</title></svelte:head>
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
<section
	bind:this={section}
	class="feed-section"
	data-refreshable
	aria-busy={!!pending}
	aria-label={`${data.feed.name} stories`}
>
	<div class="list-heading">
		<h2>{data.feed.name === 'Top' ? 'The front page' : data.feed.name}</h2>
		<div class="feed-actions">
			<span>{stories.length} of {ids.length} stories</span>
			<button
				class="feed-refresh"
				type="button"
				disabled={!active || !!pending}
				onclick={() => (failedAction === 'refresh' ? retryRefresh?.() : refresh(readingPosition()))}
			>
				<Icon name="refresh" size={15} />{pending === 'refresh'
					? 'Refreshing…'
					: failedAction === 'refresh'
						? 'Retry refresh'
						: 'Refresh'}
			</button>
		</div>
	</div>
	{#if pending === 'refresh' || failedAction === 'refresh' || message === 'Feed refreshed.'}
		<p class="feed-feedback" role="status">
			{pending === 'refresh' ? 'Refreshing feed…' : failure || message}
		</p>
	{/if}
	{#if feedFailure}<div class="notice failure" role="alert">
			<h2>A little turbulence.</h2>
			<p>{feedFailure}</p>
			<a class="primary" href={page.url.pathname + page.url.search} data-sveltekit-reload
				>Try again <Icon name="arrow" /></a
			>
		</div>{:else}
		{#if initialFailed}<p class="notice" role="status">
				Some stories couldn’t be loaded. <a
					href={page.url.pathname + page.url.search}
					data-sveltekit-reload>Retry loading stories</a
				>
			</p>{/if}
		{#if first > 0 && stories.length}
			<div class="earlier-stories">
				<button
					class="secondary"
					disabled={!active || !!pending}
					onclick={(event) => loadBatch(event, true)}
				>
					{pending === 'earlier'
						? 'Loading earlier stories…'
						: failedAction === 'earlier'
							? 'Retry earlier stories'
							: 'Earlier stories'}
				</button>
				{#if failedAction === 'earlier'}<p class="inline-error" role="status">{failure}</p>{/if}
			</div>
		{/if}
		{#each stories as item (item.id)}<StoryRow {item} rank={ranks.get(item.id) ?? 0} />{:else}<div
				class="notice"
			>
				<h2>You’ve reached the quiet part.</h2>
				<p>
					No stories here. <a href={data.feed.id === 'top' ? '/' : `/${data.feed.id}`}
						>Back to the latest stories</a
					>
				</p>
			</div>{/each}
	{/if}
	<div class="load-more" aria-busy={pending === 'more'}>
		<span
			>{feedFailure
				? 'Try loading the feed again.'
				: cursor < ids.length
					? 'Curiosity doesn’t stop here.'
					: 'You’re all caught up.'}</span
		>
		{#if cursor < ids.length}
			<button class="primary" onclick={(event) => loadBatch(event)} disabled={!active || !!pending}>
				{pending === 'more'
					? 'Loading stories…'
					: failedAction === 'more'
						? 'Retry stories'
						: 'More stories'}
				<Icon name="arrow" />
			</button>
		{/if}
		<p class="load-feedback" role="status">
			{failedAction === 'more' ? failure : message === 'Feed refreshed.' ? '' : message}
		</p>
	</div>
</section>

{#if newAbove.length}
	<div class="reader-notice">
		<button
			class="primary"
			type="button"
			disabled={!active || !!pending}
			onclick={() => refresh(undefined, true)}
		>
			↑ New stories above
		</button>
	</div>
{/if}
{#if pull > 0 || pullRefreshing}
	<div
		class="pull-refresh"
		data-phase={pullRefreshing ? 'refreshing' : pullReady ? 'ready' : 'pulling'}
		style:--pull-top={`${pullTop}px`}
		style:--pull-offset={`${pullRefreshing ? 13 : pull * 0.36}px`}
		style:--pull-angle={`${Math.min(1, pull / pullThreshold) * 240 - 140}deg`}
		aria-hidden="true"
	>
		<span class="pull-refresh-icon"><Icon name="refresh" size={18} /></span>
		<span
			>{pullRefreshing ? 'Refreshing…' : pullReady ? 'Release to refresh' : 'Pull to refresh'}</span
		>
	</div>
{/if}
