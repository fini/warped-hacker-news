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

const noirAmber = { id: 'amber', name: 'Amber', swatch: '#ffc477' } as const;
const noirColors = [
	{ id: 'cyan', name: 'Cyan', swatch: '#73e7e1' },
	{ id: 'violet', name: 'Violet', swatch: '#c3a6ff' },
	{ id: 'pink', name: 'Pink', swatch: '#ff9ec9' },
	noirAmber,
	{ id: 'lime', name: 'Lime', swatch: '#c9ec81' }
] as const;

export const accentPalettes = {
	modern: [
		{ id: 'terracotta', name: 'Original', swatch: '#bb4028', darkSwatch: '#f19875' },
		{ id: 'ocean', name: 'Blue', swatch: '#194de0', darkSwatch: '#73a7ff' },
		{ id: 'forest', name: 'Jade', swatch: '#007751', darkSwatch: '#39e6a4' },
		{ id: 'plum', name: 'Hot Pink', swatch: '#b5117a', darkSwatch: '#ff72cf' },
		{ id: 'ochre', name: 'Gold', swatch: '#a35b00', darkSwatch: '#ffd447' }
	],
	noir: noirColors,
	noirSecondary: noirColors
} as const;

export type AccentChannel = keyof typeof accentPalettes;
export type Accents = { [T in AccentChannel]: (typeof accentPalettes)[T][number]['id'] };

export const accentControls = [
	{ id: 'modern', theme: 'modern', label: 'Accent color', cookie: 'whn_modern_accent' },
	{ id: 'noir', theme: 'noir', label: 'Primary color', cookie: 'whn_noir_accent' },
	{
		id: 'noirSecondary',
		theme: 'noir',
		label: 'Secondary color',
		cookie: 'whn_noir_secondary_accent'
	}
] as const;

export function getAccent(theme: AccentChannel, value: unknown) {
	const palette = accentPalettes[theme];
	const defaultColor = theme === 'noirSecondary' ? noirAmber : palette[0];
	return palette.find((color) => color.id === value) ?? defaultColor;
}

export function resolveAccent<T extends AccentChannel>(theme: T, value: unknown): Accents[T] {
	return getAccent(theme, value).id as Accents[T];
}

export function darkAccent(color: ReturnType<typeof getAccent>) {
	return 'darkSwatch' in color ? color.darkSwatch : color.swatch;
}
