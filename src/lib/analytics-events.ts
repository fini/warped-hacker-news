export const analyticsEvents = {
	page_view: [
		'top',
		'new',
		'best',
		'ask',
		'show',
		'jobs',
		'discussion',
		'profile',
		'saved',
		'other'
	],
	feed_refresh: [],
	stories_load: ['more', 'earlier'],
	comments_load: [],
	bookmark_change: ['save', 'remove'],
	appearance_apply: []
} as const;

export type AnalyticsEvent = keyof typeof analyticsEvents;
export type EventDetail<T extends AnalyticsEvent> = (typeof analyticsEvents)[T][number];

export const consentCookie = 'whn_analytics';
export const analyticsLifetime = 180 * 24 * 60 * 60;
export const sessionLifetimeMs = 30 * 60 * 1000;
