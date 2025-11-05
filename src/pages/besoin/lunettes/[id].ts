import type { APIRoute } from 'astro';
import { handleAuthFromCookies } from '../../../utils/auth.js';

export const prerender = false;

const escapeFilterValue = (value: string) => value.replace(/"/g, '\\"');

const slugify = (value: string | null | undefined) =>
	(value ?? '')
		.toString()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

export const GET: APIRoute = async ({ params, request }) => {
	const { id } = params;
	const { pb, authCookie } = await handleAuthFromCookies(request);
	const headers = new Headers({ 'Content-Type': 'application/json' });
	if (authCookie) {
		headers.set('Set-Cookie', authCookie);
	}

	if (!id) {
		return new Response(JSON.stringify({ ok: false, error: 'missing-id' }), {
			status: 400,
			headers
		});
	}

	if (!pb?.authStore?.isValid || !pb.authStore.model?.id) {
		return new Response(JSON.stringify({ ok: false, error: 'not-authenticated' }), {
			status: 401,
			headers
		});
	}

	try {
		const userId = pb.authStore.model.id;
		const compose = await pb
			.collection('Compose')
			.getFirstListItem(
				`IdLunette="${escapeFilterValue(id)}" && IdUsers="${escapeFilterValue(userId)}"`,
				{ fields: 'id' }
			)
			.catch(() => null);

		if (!compose) {
			return new Response(JSON.stringify({ ok: false, error: 'not-found' }), {
				status: 404,
				headers
			});
		}

		const lunette = await pb.collection('lunette').getOne(id, {
			expand: 'Materiaux_monture,Materiaux_branche'
		});

		const frameLabel = lunette?.expand?.Materiaux_monture?.libelle ?? null;
		const branchLabel = lunette?.expand?.Materiaux_branche?.libelle ?? null;

		const responsePayload = {
			ok: true,
			options: {
				materialFrameId: lunette.Materiaux_monture ?? null,
				materialFrameLabel: frameLabel,
				materialFrameSlug: slugify(frameLabel),
				materialTemplesId: lunette.Materiaux_branche ?? null,
				materialTemplesLabel: branchLabel,
				materialTemplesSlug: slugify(branchLabel),
				bridge: lunette.largeur_pont ?? 5,
				lensSize: lunette.taille_verre ?? 5,
				lensColor: lunette.couleur_verre ?? 'transparent',
				finish: lunette.finition ?? 'brillant',
				engraveText: lunette.gravure ?? '',
				engraveSide: lunette.position_gravure ?? 'gauche',
				price: lunette.prix_final ?? 250
			},
			svg: lunette.code_svg ?? ''
		};

		return new Response(JSON.stringify(responsePayload), {
			status: 200,
			headers
		});
	} catch (error: any) {
		console.error('fetch-lunette error', error);
		const status = Number(error?.status) || 500;
		return new Response(
			JSON.stringify({ ok: false, error: error?.message || 'internal-error' }),
			{
				status,
				headers
			}
		);
	}
};
