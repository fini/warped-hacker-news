import { sessionLifetimeMs, type AnalyticsEvent, type EventDetail } from './analytics-events';

const storageKey = 'whn-analytics-session';
let enabled = false;
let lastPage: string | undefined;

export function setAnalyticsEnabled(accepted: boolean) {
	enabled = accepted;
	if (accepted) return;
	lastPage = undefined;
	try {
		sessionStorage.removeItem(storageKey);
	} catch {
		// Storage can be disabled.
	}
}

export function trackAnalytics<T extends AnalyticsEvent>(
	event: T,
	...detail: EventDetail<T> extends never ? [] : [EventDetail<T>]
) {
	if (!enabled) return;
	try {
		const now = Date.now();
		const previous = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as {
			clientId: string;
			sessionId: number;
			last: number;
		} | null;
		const elapsed = previous ? now - previous.last : -1;
		const session =
			previous && elapsed >= 0 && elapsed < sessionLifetimeMs
				? { ...previous, last: now }
				: { clientId: crypto.randomUUID(), sessionId: Math.floor(now / 1000), last: now };
		sessionStorage.setItem(storageKey, JSON.stringify(session));
		void fetch('/api/analytics', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				event,
				detail: detail[0],
				clientId: session.clientId,
				sessionId: session.sessionId,
				engagementMs:
					session.clientId === previous?.clientId ? Math.max(1, Math.min(elapsed, 60_000)) : 1
			}),
			referrerPolicy: 'no-referrer',
			keepalive: true
		}).catch(() => {});
	} catch {
		// Without session storage, or if a request is blocked, the reader stays usable.
	}
}

export function trackPage(path: string, route: string | null, feed?: string) {
	if (!enabled || path === lastPage) return;
	lastPage = path;
	const category =
		route === '/'
			? 'top'
			: route === '/item/[id]'
				? 'discussion'
				: route === '/user/[username]'
					? 'profile'
					: route === '/saved'
						? 'saved'
						: route === '/[feed]' &&
							  (feed === 'new' ||
									feed === 'best' ||
									feed === 'ask' ||
									feed === 'show' ||
									feed === 'jobs')
							? feed
							: 'other';
	trackAnalytics('page_view', category);
}
