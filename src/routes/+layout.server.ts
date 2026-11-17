export const load = ({ locals }: import('./$types').LayoutServerLoadEvent) => ({
	motion: locals.motion,
	theme: locals.theme,
	appearance: locals.appearance,
	build: __BUILD__
});
