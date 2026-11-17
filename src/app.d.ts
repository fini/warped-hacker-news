declare const __BUILD__: { revision: string; builtAt: string };
declare namespace App {
	interface Locals {
		theme: import('./lib/themes').Theme;
		appearance: import('./lib/themes').Appearance;
	}
}
