import { error, json } from '@sveltejs/kit';
import { getItems } from '#lib/server/hn';

export const GET: import('./$types').RequestHandler = async ({ url, fetch }) => {
	const raw = url.searchParams.get('ids') ?? '';
	if (raw.length > 600 || !/^[1-9]\d*(,[1-9]\d*){0,29}$/.test(raw))
		error(400, 'Invalid story batch.');
	const ids = raw.split(',').map(Number);
	if (!ids.every(Number.isSafeInteger) || new Set(ids).size !== ids.length)
		error(400, 'Invalid story IDs.');
	const result = await getItems(ids, fetch);
	return json(
		{ ...result, items: result.items.filter((item) => !item.dead && !item.deleted) },
		{
			headers: { 'Cache-Control': 'no-store' }
		}
	);
};
