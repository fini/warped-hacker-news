import type { Handle } from '@sveltejs/kit/hooks';
import { resolveTheme, resolveAppearance, resolveFontSize, resolveDensity } from '#lib/themes';
export const handle: Handle = async ({ event, resolve }) => {
	event.locals.fontSize = resolveFontSize(event.cookies.get('whn_font_size'));
	event.locals.density = resolveDensity(event.cookies.get('whn_density'));
	event.locals.motion = event.cookies.get('whn_motion') !== 'off';
	event.locals.theme = resolveTheme(event.cookies.get('whn_theme'));
	event.locals.appearance = resolveAppearance(event.cookies.get('whn_appearance'));
	const response = await resolve(event, {
		transformPageChunk: ({ html }) =>
			html
				.replace('%theme%', event.locals.theme)
				.replace('%appearance%', event.locals.appearance)
				.replace('%fontSize%', event.locals.fontSize)
				.replace('%density%', event.locals.density)
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
