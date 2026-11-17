import { error } from '@sveltejs/kit';
import { feeds, parsePage } from '../hn';
import { getFeed } from './hn';
export async function loadFeed(feedId: string, url: URL, fetcher: typeof fetch) {
	const feed = feeds.find((f) => f.id === feedId);
	if (!feed) error(404, 'This feed does not exist.');
	const page = parsePage(url.searchParams.get('page'));
	try {
		return { feed, page, ...(await getFeed(feed.id, page, fetcher)), failure: '' };
	} catch {
		return {
			feed,
			page,
			items: [],
			failed: 0,
			total: 0,
			hasMore: false,
			failure: 'We couldn’t reach Hacker News. Please try again.'
		};
	}
}
