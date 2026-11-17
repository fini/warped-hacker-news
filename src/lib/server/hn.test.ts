import { describe, it, expect, vi } from 'vitest';
import { cleanHtml, getFeed, getItems } from './hn';
import { parsePage, safeUrl } from '../hn';
import { resolveAppearance, resolveTheme } from '../themes';
function mockFetch(handler: (path: string) => unknown): typeof fetch {
	return vi.fn(async (input) => {
		const path = String(input);
		const result = handler(path);
		return Response.json(result);
	}) as typeof fetch;
}
describe('HN data boundary', () => {
	it('removes executable markup and unsafe links, preserving formatting', () => {
		const html = cleanHtml(
			'<p>Hello <i>world</i><script>alert(1)</script><a href="javascript:alert(1)" onclick="evil()">bad</a><a href="https://example.com">good</a></p>'
		);
		expect(html).not.toMatch(/<script|javascript:|onclick/);
		expect(html).toContain('<i>world</i>');
		expect(html).toContain('rel="nofollow noopener noreferrer"');
	});
	it('keeps feed ordering and fetches only the requested page', async () => {
		const fetcher = mockFetch((path) =>
			path.includes('topstories')
				? Array.from({ length: 65 }, (_, i) => i + 1)
				: { id: Number(path.match(/item\/(\d+)/)?.[1]), title: 'Story' }
		);
		const result = await getFeed('top', 2, fetcher);
		expect(result.items.map((i) => i.id)).toEqual(Array.from({ length: 30 }, (_, i) => i + 31));
		expect(result.hasMore).toBe(true);
		expect(fetcher).toHaveBeenCalledTimes(31);
	});
	it('retains successful items and reports failures, with bounded concurrency', async () => {
		let active = 0,
			max = 0;
		const fetcher = vi.fn(async (input) => {
			active++;
			max = Math.max(max, active);
			await new Promise((r) => setTimeout(r, 2));
			active--;
			if (String(input).includes('/3.json')) throw new Error('offline');
			return Response.json({ id: Number(String(input).match(/item\/(\d+)/)?.[1]) });
		}) as typeof fetch;
		const result = await getItems(
			Array.from({ length: 20 }, (_, i) => i + 1),
			fetcher
		);
		expect(result.failed).toBe(1);
		expect(result.items).toHaveLength(19);
		expect(max).toBeLessThanOrEqual(6);
	});
	it('handles null, dead and deleted items', async () => {
		const fetcher = mockFetch((path) =>
			path.includes('topstories')
				? [1, 2, 3, 4]
				: path.includes('/1.json')
					? null
					: path.includes('/2.json')
						? { id: 2, dead: true }
						: path.includes('/3.json')
							? { id: 3, deleted: true }
							: { id: 4 }
		);
		expect((await getFeed('top', 1, fetcher)).items.map((i) => i.id)).toEqual([4]);
	});
	it('rejects unsafe links and normalizes page and theme preferences', () => {
		expect(safeUrl('javascript:alert(1)')).toBeUndefined();
		expect(safeUrl('https://example.com')).toBe('https://example.com/');
		expect(parsePage('-1')).toBe(1);
		expect(parsePage('1e2')).toBe(1);
		expect(parsePage('2')).toBe(2);
		expect(resolveTheme('<script>')).toBe('modern');
		expect(resolveAppearance('wrong')).toBe('system');
	});
});
