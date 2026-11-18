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
