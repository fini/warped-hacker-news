export const feeds = [
	{ id: 'top', name: 'Top', description: 'What the community is reading right now.' },
	{ id: 'new', name: 'New', description: 'Fresh ideas, just submitted.' },
	{ id: 'best', name: 'Best', description: 'The stories that made an impression.' },
	{ id: 'ask', name: 'Ask HN', description: 'Good questions. Interesting perspectives.' },
	{ id: 'show', name: 'Show HN', description: 'Things people are making.' },
	{ id: 'jobs', name: 'Jobs', description: 'Find your next chapter.' }
] as const;
export type Feed = (typeof feeds)[number]['id'];
export interface Item {
	id: number;
	type?: string;
	by?: string;
	time?: number;
	title?: string;
	url?: string;
	text?: string;
	score?: number;
	descendants?: number;
	kids?: number[];
	deleted?: boolean;
	dead?: boolean;
	parent?: number;
}
export interface User {
	id: string;
	created?: number;
	karma?: number;
	about?: string;
}
export function safeUrl(value?: string): string | undefined {
	try {
		const u = new URL(value ?? '');
		return ['https:', 'http:'].includes(u.protocol) ? u.href : undefined;
	} catch {
		return undefined;
	}
}
export function domain(value?: string) {
	const url = safeUrl(value);
	return url ? new URL(url).hostname.replace(/^www\./, '') : '';
}
export function age(time?: number) {
	if (!time) return '';
	const seconds = Math.max(0, Date.now() / 1000 - time);
	for (const [size, label] of [
		[86400, 'd'],
		[3600, 'h'],
		[60, 'm']
	] as const) {
		if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
	}
	return 'just now';
}
export function parsePage(value: string | null) {
	return value && /^[1-9]\d*$/.test(value) ? Math.min(Number(value), 10000) : 1;
}
