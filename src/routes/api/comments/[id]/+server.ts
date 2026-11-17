import { json, error } from '@sveltejs/kit';
import { getItem, getItems } from '#lib/server/hn';
export const GET: import('./$types').RequestHandler = async ({ params, url, fetch }) => {
	if (!/^[1-9]\d*$/.test(params.id) || !Number.isSafeInteger(Number(params.id)))
		error(400, 'Invalid item.');
	const raw = url.searchParams.get('offset') ?? '0';
	if (!/^\d{1,6}$/.test(raw)) error(400, 'Invalid offset.');
	try {
		const parent = await getItem(Number(params.id), fetch);
		if (!parent) error(404, 'Item not found.');
		const offset = Number(raw);
		const ids = parent.kids ?? [];
		const batch = await getItems(ids.slice(offset, offset + 15), fetch);
		return json({ ...batch, nextOffset: offset + 15, hasMore: offset + 15 < ids.length });
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		error(503, 'Could not load comments. Please try again.');
	}
};
