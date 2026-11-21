export const load = ({ locals }: import('./$types').LayoutServerLoadEvent) => ({
	accents: locals.accents,
	fontSize: locals.fontSize,
	density: locals.density,
	motion: locals.motion,
	theme: locals.theme,
	appearance: locals.appearance,
	build: __BUILD__
});
