import { describe, it, expect, vi } from 'vitest';
import { GET } from './+server';

const run = (query: string, fetcher: typeof fetch) =>
	GET({
		url: new URL(`https://reader.test/api/stories?ids=${query}`),
		fetch: fetcher
	} as Parameters<typeof GET>[0]);
describe('story batches', () => {
	it('rejects invalid, duplicate and oversized batches before fetching', async () => {
		const fetcher = vi.fn();
		for (const query of [
			'',
			'0',
			'-1',
			'1,1',
			'1e2',
			'9007199254740992',
			Array.from({ length: 31 }, (_, i) => i + 1).join(',')
		]) {
			await expect(run(query, fetcher)).rejects.toMatchObject({ status: 400 });
		}
		expect(fetcher).not.toHaveBeenCalled();
	});
	it('retains upstream order, sanitizes content and reports partial failures', async () => {
		const fetcher = vi.fn(async (input) => {
			const id = Number(String(input).match(/item\/(\d+)/)?.[1]);
			if (id === 3) throw new Error('offline');
			return Response.json(
				id === 2 ? { id, dead: true } : { id, text: '<p>Safe<script>bad()</script></p>' }
			);
		}) as typeof fetch;
		const response = await run('4,2,3,1', fetcher);
		const result = await response.json();
		expect(result.items.map((item: { id: number }) => item.id)).toEqual([4, 1]);
		expect(result.failed).toBe(1);
		expect(result.items[0].text).toBe('<p>Safe</p>');
		expect(response.headers.get('Cache-Control')).toBe('no-store');
	});
});
