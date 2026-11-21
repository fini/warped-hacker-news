import { feeds, type Feed } from './hn';

export const refreshAfter = 5 * 60_000;
const resumeFor = 60 * 60_000;
const positionKey = 'whn-reading-position-v1';

export interface ReadingPosition {
	feed: Feed;
	at: number;
	anchors: number[];
	offset: number;
	ids: number[];
}

export function recentPosition(): ReadingPosition | null {
	try {
		const value = JSON.parse(localStorage.getItem(positionKey) ?? 'null') as ReadingPosition | null;
		if (!value || !feeds.some(({ id }) => id === value.feed)) return null;
		const elapsed = Date.now() - value.at;
		if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed >= resumeFor) return null;
		if (!Number.isFinite(value.offset)) return null;
		if (!Array.isArray(value.anchors) || value.anchors.length > 21 || !value.anchors.every(validId))
			return null;
		if (!Array.isArray(value.ids) || !value.ids.every(validId)) return null;
		return value;
	} catch {
		return null;
	}
}

function validId(id: number) {
	return Number.isSafeInteger(id) && id > 0;
}

export function rememberPosition(position: ReadingPosition) {
	try {
		localStorage.setItem(positionKey, JSON.stringify(position));
	} catch {
		// The reader still works when storage is disabled or full.
	}
}

export function feedPath(feed: Feed) {
	return feed === 'top' ? '/' : `/${feed}`;
}
