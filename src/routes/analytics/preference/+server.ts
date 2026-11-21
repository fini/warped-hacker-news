import { error, redirect } from '@sveltejs/kit';
import { ANALYTICS_ENABLED, GA4_API_SECRET, GA4_MEASUREMENT_ID } from '$app/env/private';
import { analyticsLifetime, consentCookie } from '#lib/analytics-events';
import { analyticsConfig, readSmallBody } from '#lib/server/analytics';

export const POST: import('./$types').RequestHandler = async ({ request, cookies, url }) => {
	if (!analyticsConfig(ANALYTICS_ENABLED, GA4_MEASUREMENT_ID, GA4_API_SECRET))
		error(404, 'Analytics is unavailable.');
	if (request.headers.get('Origin') !== url.origin) error(403, 'Invalid origin.');
	if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/x-www-form-urlencoded')
		error(415, 'Unsupported form.');
	const body = await readSmallBody(request);
	if (body === null) error(400, 'Invalid preference.');
	const data = new URLSearchParams(body);
	const choice = data.get('choice');
	if (choice === 'no' || choice === 'yes') {
		cookies.set(consentCookie, choice, {
			path: '/',
			maxAge: analyticsLifetime,
			sameSite: 'lax',
			httpOnly: true,
			secure: url.protocol === 'https:'
		});
	}
	let back = '/';
	try {
		const target = data.get('returnTo');
		if (target?.startsWith('/')) {
			const resolved = new URL(target, url);
			if (resolved.origin === url.origin && !resolved.pathname.startsWith('//'))
				back = resolved.pathname + resolved.search;
		}
	} catch {
		// Invalid return URLs fall back to the front page.
	}
	redirect(303, back);
};
