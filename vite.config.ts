import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-cloudflare';
import { execFileSync } from 'node:child_process';
let revision = 'local';
try {
	revision = execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'ignore']
	}).trim();
} catch {
	/* Source archives have no Git metadata. */
}
export default defineConfig({
	plugins: [sveltekit({ adapter: adapter() })],
	define: { __BUILD__: JSON.stringify({ revision, builtAt: new Date().toISOString() }) }
});
