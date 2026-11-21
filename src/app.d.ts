declare const __BUILD__: { revision: string; builtAt: string };
declare namespace App {
	interface Locals {
		accents: import('./lib/themes').Accents;
		fontSize: import('./lib/themes').FontSize;
		density: import('./lib/themes').Density;
		motion: boolean;
		theme: import('./lib/themes').Theme;
		appearance: import('./lib/themes').Appearance;
	}
}
