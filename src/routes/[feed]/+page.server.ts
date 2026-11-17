import { loadFeed } from '#lib/server/feed';
export const load: import('./$types').PageServerLoad = ({ params, url, fetch }) =>
	loadFeed(params.feed, url, fetch);
