export const themes = [
	{ id: 'modern', name: 'Modern', description: 'Clean lines. Room to read.', icon: 'layout' },
	{ id: 'lcars', name: 'LCARS', description: 'A little starship atmosphere.', icon: 'panels' },
	{ id: 'matrix', name: 'Matrix', description: 'Follow the green signal.', icon: 'terminal' },
	{ id: 'noir', name: 'Neon Noir', description: 'Rain-soaked neon. Cinematic cards.', icon: 'city' }
] as const;
export type Theme = (typeof themes)[number]['id'];
export type Appearance = 'system' | 'light' | 'dark';
export function resolveTheme(value: unknown): Theme {
	return themes.find((t) => t.id === value)?.id ?? 'modern';
}
export function resolveAppearance(value: unknown): Appearance {
	return value === 'light' || value === 'dark' ? value : 'system';
}

export const fontSizes = ['small', 'medium', 'large'] as const;
export type FontSize = (typeof fontSizes)[number];
export const densities = ['compact', 'normal', 'spacious'] as const;
export type Density = (typeof densities)[number];
export function resolveFontSize(value: unknown): FontSize {
	return fontSizes.find((size) => size === value) ?? 'medium';
}
export function resolveDensity(value: unknown): Density {
	return densities.find((density) => density === value) ?? 'normal';
}
