import { GA4_API_SECRET, GA4_MEASUREMENT_ID } from '$app/env/private';
import { consentCookie } from '#lib/analytics-events';
import { analyticsConfig } from '#lib/server/analytics';

export const load = ({ locals, cookies }: import('./$types').LayoutServerLoadEvent) => ({
	analyticsAvailable: !!analyticsConfig(GA4_MEASUREMENT_ID, GA4_API_SECRET),
	analyticsChoice: cookies.get(consentCookie) ?? null,
	accents: locals.accents,
	fontSize: locals.fontSize,
	density: locals.density,
	motion: locals.motion,
	theme: locals.theme,
	appearance: locals.appearance,
	build: __BUILD__
});
