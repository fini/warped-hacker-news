import { describe, expect, it, vi } from 'vitest';
import { analyticsConfig, measurementPayload, readAnalyticsBody, sendAnalytics } from './analytics';

const origin = 'https://reader.example';
const envelope = {
	clientId: 'statically-invalid',
	sessionId: 1763650000,
	engagementMs: 5
};
const session = { ...envelope, clientId: 'abcdef12-3456-4789-8abc-0123456789ab' };

describe('analytics privacy boundary', () => {
	it('projects only the allowlisted screen and does not forward reader content', () => {
		const payload = measurementPayload(
			{
				...session,
				event: 'page_view',
				detail: 'discussion',
				url: 'https://reader.example/item/123',
				title: 'Private data',
				userId: 'someone',
				ip_override: '203.0.113.2',
				referrer: 'https://example.com'
			},
			origin
		);
		expect(payload).toEqual({
			client_id: session.clientId,
			consent: { ad_user_data: 'DENIED', ad_personalization: 'DENIED' },
			events: [
				{
					name: 'page_view',
					params: {
						session_id: session.sessionId,
						engagement_time_msec: 5,
						page_location: origin + '/screen/discussion',
						page_title: 'Warped HN · discussion'
					}
				}
			]
		});
	});
	it('rejects unknown events, free text, invalid session IDs and oversized bodies', async () => {
		expect(measurementPayload({ ...envelope, event: 'feed_refresh' }, origin)).toBeNull();
		expect(measurementPayload({ ...session, event: 'user_lookup' }, origin)).toBeNull();
		expect(
			measurementPayload({ ...session, event: 'page_view', detail: '/user/someone' }, origin)
		).toBeNull();
		expect(
			measurementPayload({ ...session, event: 'bookmark_change', detail: 'title' }, origin)
		).toBeNull();
		const oversized = new Request(origin, {
			method: 'POST',
			body: JSON.stringify('x'.repeat(1024))
		});
		await expect(readAnalyticsBody(oversized)).resolves.toBeNull();
	});
	it('uses server credentials and sends no incoming headers', async () => {
		expect(analyticsConfig(true, 'G-TEST', undefined)).toBeNull();
		expect(analyticsConfig(false, 'G-TEST', 'unit-test')).toBeNull();
		expect(analyticsConfig(undefined, 'G-TEST', 'unit-test')).toBeNull();
		const config = analyticsConfig(true, 'G-TEST', 'unit-test')!;
		const payload = measurementPayload(
			{ ...session, event: 'bookmark_change', detail: 'save' },
			origin
		)!;
		const fetcher = vi.fn(
			async (_url: URL, _init: RequestInit) => new Response(null, { status: 204 })
		);
		await sendAnalytics(config, payload, fetcher as typeof fetch);
		const [url, init] = fetcher.mock.calls[0];
		expect(url.hostname).toBe('region1.google-analytics.com');
		expect(url.searchParams.get('api_secret')).toBe('unit-test');
		expect(init.headers).toEqual({
			'Content-Type': 'application/json',
			'User-Agent': 'Warped-HN',
			'CF-Connecting-IP': '192.0.2.1',
			'X-Forwarded-For': '192.0.2.1',
			'X-Real-IP': '192.0.2.1'
		});
		expect(JSON.parse(String(init.body))).toEqual(payload);
	});
});
