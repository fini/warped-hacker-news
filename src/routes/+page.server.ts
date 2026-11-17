import { loadFeed } from '#lib/server/feed';
export const load: import('./$types').PageServerLoad = ({ url, fetch }) =>
	loadFeed('top', url, fetch);
