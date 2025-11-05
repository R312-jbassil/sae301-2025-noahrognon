import type { APIRoute } from 'astro';
import { handleAuthFromCookies } from '../../utils/auth.js';

export const prerender = false;

const headersWithCookie = (cookie: string | null) => {
	const headers = new Headers({ 'Content-Type': 'application/json' });
	if (cookie) {
		headers.set('Set-Cookie', cookie);
	}
	return headers;
};

const escapeValue = (value: string) => value.replace(/"/g, '\\"');

export const POST: APIRoute = async ({ request }) => {
	const { pb, authCookie } = await handleAuthFromCookies(request);
	const headers = headersWithCookie(authCookie ?? null);

	if (!pb?.authStore?.isValid || !pb.authStore.model?.id) {
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

		const userId = pb.authStore.model.id;

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
