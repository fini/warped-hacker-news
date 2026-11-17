export const themes = [
	{ id: 'modern', name: 'Modern' },
	{ id: 'lcars', name: 'LCARS' },
	{ id: 'matrix', name: 'Matrix' }
] as const;
export type Theme = (typeof themes)[number]['id'];
export type Appearance = 'system' | 'light' | 'dark';
export function resolveTheme(value: unknown): Theme {
	return themes.find((t) => t.id === value)?.id ?? 'modern';
}
export function resolveAppearance(value: unknown): Appearance {
	return value === 'light' || value === 'dark' ? value : 'system';
}
