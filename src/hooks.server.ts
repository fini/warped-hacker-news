import type { Handle } from '@sveltejs/kit/hooks';
import {
	resolveTheme,
	resolveAppearance,
	resolveFontSize,
	resolveDensity,
	resolveAccent,
	getAccent,
	darkAccent
} from '#lib/themes';
export const handle: Handle = async ({ event, resolve }) => {
	event.locals.accents = {
		modern: resolveAccent('modern', event.cookies.get('whn_modern_accent')),
		noir: resolveAccent('noir', event.cookies.get('whn_noir_accent')),
		noirSecondary: resolveAccent('noirSecondary', event.cookies.get('whn_noir_secondary_accent'))
	};
	event.locals.fontSize = resolveFontSize(event.cookies.get('whn_font_size'));
	event.locals.density = resolveDensity(event.cookies.get('whn_density'));
	event.locals.motion = event.cookies.get('whn_motion') !== 'off';
	event.locals.theme = resolveTheme(event.cookies.get('whn_theme'));
	event.locals.appearance = resolveAppearance(event.cookies.get('whn_appearance'));
	const { theme, accents } = event.locals;
	const accent = theme === 'modern' || theme === 'noir' ? getAccent(theme, accents[theme]) : null;
	let accentStyle = accent
		? `--accent-light:${accent.swatch};--accent-dark:${darkAccent(accent)}`
		: '';
	if (theme === 'noir') {
		accentStyle += `;--accent-secondary:${getAccent('noirSecondary', accents.noirSecondary).swatch}`;
	}
	const response = await resolve(event, {
		transformPageChunk: ({ html }) =>
			html
				.replace('%theme%', theme)
				.replace('%accent%', accent?.id ?? '')
				.replace('%accentStyle%', accentStyle)
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
	if (response.headers.get('Cache-Control') !== 'no-store')
		response.headers.set('Cache-Control', 'private, no-cache');
	return response;
};
