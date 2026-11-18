import { redirect } from '@sveltejs/kit';
import { resolveTheme, resolveAppearance, resolveFontSize, resolveDensity } from '#lib/themes';
export const POST: import('./$types').RequestHandler = async ({ request, cookies }) => {
	const data = await request.formData();
	const options = {
		path: '/',
		maxAge: 31536000,
		sameSite: 'lax' as const,
		httpOnly: true,
		secure: new URL(request.url).protocol === 'https:'
	};
	cookies.set('whn_font_size', resolveFontSize(data.get('fontSize')), options);
	cookies.set('whn_density', resolveDensity(data.get('density')), options);
	cookies.set('whn_motion', data.get('motion') === 'on' ? 'on' : 'off', options);
	cookies.set('whn_theme', resolveTheme(data.get('theme')), options);
	cookies.set('whn_appearance', resolveAppearance(data.get('appearance')), options);
	const back = String(data.get('returnTo') ?? '/');
	redirect(
		303,
		back.startsWith('/') && !back.startsWith('//') && !back.includes('\\') ? back : '/'
	);
};
