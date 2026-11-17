import { it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { themes } from './themes';
it('registers independent themes with scoped selectors', () => {
	expect(themes.map((t) => t.id)).toEqual(['modern', 'lcars', 'matrix']);
	for (const theme of themes) {
		const css = readFileSync(`src/themes/${theme.id}.css`, 'utf8');
		for (const rule of css.split('}')) {
			const selector = rule
				.slice(rule.lastIndexOf('{', rule.lastIndexOf('{') - 1) + 1, rule.lastIndexOf('{'))
				.trim();
			if (!selector || selector.startsWith('@')) continue;
			for (const part of selector.split(',')) {
				expect(part.replace(/["']/g, '')).toContain(`data-theme=${theme.id}`);
			}
		}
	}
});
it('keeps theme names and private colors out of shared styles', () => {
	for (const file of readdirSync('src/styles').filter((f) => f !== 'tokens.css')) {
		expect(readFileSync(`src/styles/${file}`, 'utf8')).not.toMatch(
			/#[\da-f]{3,8}\b|lcars|matrix|Barlow/i
		);
	}
});
