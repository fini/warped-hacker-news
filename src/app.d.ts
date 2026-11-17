declare const __BUILD__: { revision: string; builtAt: string };
declare namespace App {
	interface Locals {
		motion: boolean;
		theme: import('./lib/themes').Theme;
		appearance: import('./lib/themes').Appearance;
	}
}
