import { error } from '@sveltejs/kit';
import { getUser } from '#lib/server/hn';
export const load: import('./$types').PageServerLoad = async ({ params, fetch }) => {
	if (!/^[\w-]{1,50}$/.test(params.username)) error(404, 'User not found.');
	let user;
	try {
		user = await getUser(params.username, fetch);
	} catch {
		error(503, 'Hacker News is temporarily unavailable. Please try again.');
	}
	if (!user) error(404, 'User not found.');
	return { user };
};
