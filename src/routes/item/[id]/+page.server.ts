import { error } from '@sveltejs/kit';
import { getItem, getItems } from '#lib/server/hn';
export const load: import('./$types').PageServerLoad = async ({ params, fetch }) => {
	if (!/^[1-9]\d*$/.test(params.id) || !Number.isSafeInteger(Number(params.id)))
		error(404, 'Story not found.');
	let item;
	try {
		item = await getItem(Number(params.id), fetch);
	} catch {
		error(503, 'Hacker News is temporarily unavailable. Please try again.');
	}
	if (!item) error(404, 'Story not found.');
	const comments = await getItems((item.kids ?? []).slice(0, 15), fetch);
	return {
		item,
		comments: comments.items,
		failed: comments.failed,
		remaining: (item.kids ?? []).slice(15)
	};
};
