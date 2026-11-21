import { error, json } from '@sveltejs/kit';
import { feeds, parsePage } from '#lib/hn';
import { getFeed } from '#lib/server/hn';

export const GET: import('./$types').RequestHandler = async ({ params, url, fetch }) => {
	const feed = feeds.find(({ id }) => id === params.feed);
	if (!feed) error(404, 'Unknown feed.');
	const raw = url.searchParams.get('anchors');
	if (raw !== null && (raw.length > 360 || !/^[1-9]\d*(,[1-9]\d*){0,20}$/.test(raw)))
		error(400, 'Invalid anchors.');
	const anchors = raw?.split(',').map(Number) ?? [];
	if (!anchors.every(Number.isSafeInteger)) error(400, 'Invalid anchors.');
	try {
		const batch = await getFeed(feed.id, parsePage(url.searchParams.get('page')), fetch, anchors);
		return json(batch, { headers: { 'Cache-Control': 'no-store' } });
	} catch {
		error(503, 'Could not refresh this feed.');
	}
};
