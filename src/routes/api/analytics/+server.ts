import { GA4_API_SECRET, GA4_MEASUREMENT_ID } from '$app/env/private';
import { consentCookie } from '#lib/analytics-events';
import {
	analyticsConfig,
	measurementPayload,
	readAnalyticsBody,
	sendAnalytics
} from '#lib/server/analytics';

export const POST: import('./$types').RequestHandler = async ({ request, url, cookies }) => {
	const done = new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
	const config = analyticsConfig(GA4_MEASUREMENT_ID, GA4_API_SECRET);
	if (
		!config ||
		cookies.get(consentCookie) !== 'yes' ||
		request.headers.get('Origin') !== url.origin ||
		request.headers.get('Content-Type')?.split(';')[0] !== 'application/json'
	)
		return done;

	const payload = measurementPayload(await readAnalyticsBody(request), url.origin);
	if (payload) await sendAnalytics(config, payload);
	return done;
};
