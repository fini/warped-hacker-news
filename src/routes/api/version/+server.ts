import { json } from '@sveltejs/kit';

export const GET: import('./$types').RequestHandler = () =>
	json(__BUILD__, { headers: { 'Cache-Control': 'no-store' } });
