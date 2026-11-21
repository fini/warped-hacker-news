import { writable } from 'svelte/store';
import { safeUrl, type Item } from './hn';

interface SavedStory {
	id: number;
	title: string;
	url?: string;
	savedAt: number;
}

const key = 'whn-saved-v1';
const store = writable<{ ready: boolean; available: boolean; stories: SavedStory[] }>({
	ready: false,
	available: false,
	stories: []
});
export const savedStories = { subscribe: store.subscribe };

function readSaved(): SavedStory[] {
	const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
	if (!Array.isArray(value)) return [];
	return value
		.filter(
			(entry) =>
				entry &&
				Number.isSafeInteger(entry.id) &&
				entry.id > 0 &&
				typeof entry.title === 'string' &&
				Number.isFinite(entry.savedAt)
		)
		.map(({ id, title, url, savedAt }) => ({ id, title, url: safeUrl(url), savedAt }));
}

export function initSavedStories() {
	function sync() {
		try {
			store.set({ ready: true, available: true, stories: readSaved() });
		} catch {
			store.set({ ready: true, available: false, stories: [] });
		}
	}
	const onStorage = (event: StorageEvent) => {
		if (event.key === key || event.key === null) sync();
	};
	sync();
	window.addEventListener('storage', onStorage);
	return () => window.removeEventListener('storage', onStorage);
}

export function toggleSaved(item: Pick<Item, 'id' | 'title' | 'url'>) {
	const before = readSaved();
	const exists = before.some(({ id }) => id === item.id);
	const stories = exists
		? before.filter(({ id }) => id !== item.id)
		: [
				{
					id: item.id,
					title: item.title || 'Untitled',
					url: safeUrl(item.url),
					savedAt: Date.now()
				},
				...before
			];
	localStorage.setItem(key, JSON.stringify(stories));
	store.set({ ready: true, available: true, stories });
}
