import type { Handle } from '@sveltejs/kit/hooks';
import { resolveTheme, resolveAppearance } from '#lib/themes';
export const handle: Handle = async ({ event, resolve }) => {
	event.locals.theme = resolveTheme(event.cookies.get('whn_theme'));
	event.locals.appearance = resolveAppearance(event.cookies.get('whn_appearance'));
	const response = await resolve(event, {
		transformPageChunk: ({ html }) =>
			html.replace('%theme%', event.locals.theme).replace('%appearance%', event.locals.appearance)
	});
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set(
		'Content-Security-Policy',
		"frame-ancestors 'none'; object-src 'none'; base-uri 'self'"
	);
	response.headers.set('Cache-Control', 'private, no-cache');
	return response;
};
