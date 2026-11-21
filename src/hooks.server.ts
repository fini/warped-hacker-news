import type { Handle } from '@sveltejs/kit/hooks';
import {
	resolveTheme,
	resolveAppearance,
	resolveFontSize,
	resolveDensity,
	resolveAccent
} from '#lib/themes';
export const handle: Handle = async ({ event, resolve }) => {
	event.locals.accents = {
		modern: resolveAccent('modern', event.cookies.get('whn_modern_accent')),
		noir: resolveAccent('noir', event.cookies.get('whn_noir_accent'))
	};
	event.locals.fontSize = resolveFontSize(event.cookies.get('whn_font_size'));
	event.locals.density = resolveDensity(event.cookies.get('whn_density'));
	event.locals.motion = event.cookies.get('whn_motion') !== 'off';
	event.locals.theme = resolveTheme(event.cookies.get('whn_theme'));
	event.locals.appearance = resolveAppearance(event.cookies.get('whn_appearance'));
	const { theme, accents } = event.locals;
	const accent = theme === 'modern' || theme === 'noir' ? accents[theme] : '';
	const response = await resolve(event, {
		transformPageChunk: ({ html }) =>
			html
				.replace('%theme%', theme)
				.replace('%accent%', accent)
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
