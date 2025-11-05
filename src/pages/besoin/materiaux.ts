import type { APIRoute } from 'astro';
import { handleAuthFromCookies } from '../../utils/auth.js';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
	const { pb, authCookie } = await handleAuthFromCookies(request);
	const headers = new Headers({ 'Content-Type': 'application/json' });
	if (authCookie) {
		headers.set('Set-Cookie', authCookie);
	}

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
