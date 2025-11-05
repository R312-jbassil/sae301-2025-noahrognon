import type { APIRoute } from 'astro';
import { applyCookies, handleAuthFromCookies } from '../../utils/auth.js';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
	const { pb, authCookie } = await handleAuthFromCookies(request);
	if (authCookie) {
		applyCookies(cookies, authCookie);
	}

	const headers = { 'Content-Type': 'application/json' };

	try {
		const records =
			(await pb
				.collection('Materiaux')
				.getFullList({ sort: '+libelle' })
				.catch(() => [])) ?? [];

		const items = records.map((record: any) => ({
			id: record.id,
			libelle: record.libelle ?? ''
		}));

		return new Response(JSON.stringify({ ok: true, items }), {
			status: 200,
			headers
		});
	} catch (error: any) {
		console.error('materiaux endpoint error', error);
		return new Response(
			JSON.stringify({
				ok: false,
				error: error?.message ?? 'materiaux-fetch-failed'
			}),
			{
				status: 500,
				headers
			}
		);
	}
};
