import sanitizeHtml from 'sanitize-html';
import type { Feed, Item, User } from '../hn';
const base = 'https://hacker-news.firebaseio.com/v0';
const endpoints: Record<Feed, string> = {
	top: 'topstories',
	new: 'newstories',
	best: 'beststories',
	ask: 'askstories',
	show: 'showstories',
	jobs: 'jobstories'
};
export function cleanHtml(value?: string) {
	return sanitizeHtml(value ?? '', {
		allowedTags: ['p', 'br', 'a', 'i', 'em', 'b', 'strong', 'code', 'pre', 'blockquote'],
		allowedAttributes: { a: ['href', 'title', 'rel'] },
		allowedSchemes: ['http', 'https', 'mailto'],
		allowProtocolRelative: false,
		transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'nofollow noopener noreferrer' }) }
	});
}
async function request<T>(path: string, fetcher: typeof fetch): Promise<T> {
	const response = await fetcher(`${base}/${path}.json`, {
		signal: AbortSignal.timeout(8000),
		cf: { cacheEverything: true, cacheTtl: 45 }
	} as RequestInit);
	if (!response.ok) throw new Error('Hacker News is temporarily unavailable. Please try again.');
	return response.json();
}
export async function getItem(id: number, fetcher: typeof fetch): Promise<Item | null> {
	const item = await request<Item | null>(`item/${id}`, fetcher);
	if (!item || typeof item.id !== 'number') return null;
	return {
		...item,
		text: cleanHtml(item.text),
		kids: Array.isArray(item.kids) ? item.kids.filter(Number.isSafeInteger) : []
	};
}
export async function getItems(ids: number[], fetcher: typeof fetch) {
	const results: (Item | null)[] = new Array(ids.length).fill(null);
	let cursor = 0;
	let failed = 0;
	await Promise.all(
		Array.from({ length: Math.min(6, ids.length) }, async () => {
			while (cursor < ids.length) {
				const index = cursor++;
				try {
					results[index] = await getItem(ids[index], fetcher);
				} catch {
					failed++;
				}
			}
		})
	);
	return { items: results.filter((i): i is Item => Boolean(i)), failed };
}
export async function getFeed(
	feed: Feed,
	page: number,
	fetcher: typeof fetch,
	anchors: number[] = []
) {
	const raw = await request<number[]>(endpoints[feed], fetcher);
	if (!Array.isArray(raw)) throw new Error('Hacker News returned an unexpected response.');
	const ids = [...new Set(raw.filter((id) => Number.isSafeInteger(id) && id > 0))];
	const anchor = anchors.find((id) => ids.includes(id));
	const start = anchor === undefined ? (page - 1) * 30 : Math.max(0, ids.indexOf(anchor) - 10);
	const end = Math.min(start + 30, ids.length);
	const result = await getItems(ids.slice(start, end), fetcher);
	const items = result.items.filter((i) => !i.deleted && !i.dead);
	const anchorId = anchors.find((id) => items.some((item) => item.id === id));
	return {
		...result,
		items,
		start,
		end,
		anchorId,
		ids,
		total: ids.length,
		hasMore: end < ids.length
	};
}
export async function getUser(name: string, fetcher: typeof fetch) {
	const user = await request<User | null>(`user/${encodeURIComponent(name)}`, fetcher);
	return user ? { ...user, about: cleanHtml(user.about) } : null;
}
