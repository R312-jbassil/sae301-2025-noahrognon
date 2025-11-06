import type { APIRoute } from 'astro';
import { createPocketBaseClient } from '../../utils/pb.js';

export const prerender = false;

const escapeValue = (value: string) => value.replace(/"/g, '\\"');

export const POST: APIRoute = async ({ request, locals }) => {
	const pb = locals?.pb ?? createPocketBaseClient();
	const headers = { 'Content-Type': 'application/json' };
	const userId = locals?.user?.id ?? pb.authStore?.model?.id ?? null;

	if (!pb?.authStore?.isValid || !userId) {
		return new Response(JSON.stringify({ ok: false, error: 'not-authenticated' }), {
			status: 401,
			headers
		});
	}

	try {
		const { lunetteId } = await request.json();
		if (!lunetteId || typeof lunetteId !== 'string') {
			return new Response(JSON.stringify({ ok: false, error: 'invalid-payload' }), {
				status: 400,
				headers
			});
		}

		const lunette = await pb
			.collection('lunette')
			.getOne(lunetteId, { fields: 'id,prix_final' })
			.catch(() => null);

		if (!lunette) {
			return new Response(JSON.stringify({ ok: false, error: 'not-found' }), {
				status: 404,
				headers
			});
		}

		const compose = await pb
			.collection('Compose')
			.getFirstListItem(
				`IdLunette="${escapeValue(lunetteId)}" && IdUsers="${escapeValue(userId)}"`,
				{ fields: 'id' }
			)
			.catch(() => null);

		if (!compose) {
			return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), {
				status: 403,
				headers
			});
		}

		const alreadyOrdered = await pb
			.collection('Commande')
			.getFirstListItem(
				`IdUtilisateur="${escapeValue(userId)}" && IdLunette="${escapeValue(lunetteId)}"`,
				{ fields: 'id' }
			)
			.catch(() => null);

		if (alreadyOrdered) {
			return new Response(JSON.stringify({ ok: false, error: 'already-ordered' }), {
				status: 409,
				headers
			});
		}

		const commande = await pb.collection('Commande').create({
			IdUtilisateur: userId,
			IdLunette: lunetteId,
			total: lunette.prix_final ?? 0
		});

		return new Response(JSON.stringify({ ok: true, orderId: commande.id }), {
			status: 200,
			headers
		});
	} catch (error: any) {
		console.error('order-existing error', error);
		return new Response(
			JSON.stringify({ ok: false, error: error?.message || 'internal-error' }),
			{
				status: 500,
				headers
			}
		);
	}
};
