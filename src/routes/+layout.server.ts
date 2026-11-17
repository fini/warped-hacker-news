export const load = ({ locals }: import('./$types').LayoutServerLoadEvent) => ({
	theme: locals.theme,
	appearance: locals.appearance,
	build: __BUILD__
});
