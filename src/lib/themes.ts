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

export const accentPalettes = {
	modern: [
		{ id: 'terracotta', name: 'Terracotta', swatch: '#bb4028' },
		{ id: 'ocean', name: 'Ocean', swatch: '#225fba' },
		{ id: 'forest', name: 'Forest', swatch: '#28744b' },
		{ id: 'plum', name: 'Plum', swatch: '#894598' },
		{ id: 'ochre', name: 'Ochre', swatch: '#94600e' }
	],
	noir: [
		{ id: 'cyan', name: 'Cyan', swatch: '#73e7e1' },
		{ id: 'violet', name: 'Violet', swatch: '#c3a6ff' },
		{ id: 'pink', name: 'Pink', swatch: '#ff9ec9' },
		{ id: 'amber', name: 'Amber', swatch: '#ffc477' },
		{ id: 'lime', name: 'Lime', swatch: '#c9ec81' }
	]
} as const;

export type AccentTheme = keyof typeof accentPalettes;
export type Accents = { [T in AccentTheme]: (typeof accentPalettes)[T][number]['id'] };

export function resolveAccent<T extends AccentTheme>(theme: T, value: unknown): Accents[T] {
	const palette = accentPalettes[theme];
	return (palette.find((color) => color.id === value) ?? palette[0]).id as Accents[T];
}
