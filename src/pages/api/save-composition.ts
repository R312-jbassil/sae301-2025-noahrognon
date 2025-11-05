import type { APIRoute } from 'astro';
import { handleAuthFromCookies } from '../../utils/auth.js';

export const prerender = false;

const isPocketBaseId = (value: string) => /^[a-z0-9]{15}$/i.test(value);

async function resolveMaterialId(pb: any, value: string | null | undefined) {
	if (!value) return null;
	if (isPocketBaseId(value)) {
		return value;
	}

	try {
		const record = await pb.collection('Materiaux').getFirstListItem(`code="${value}"`);
		return record?.id ?? null;
	} catch {
		return null;
	}
}

export const POST: APIRoute = async ({ request }) => {
	const { pb, authCookie } = await handleAuthFromCookies(request);
	const headers = new Headers({ 'Content-Type': 'application/json' });
	if (authCookie) {
		headers.set('Set-Cookie', authCookie);
	}

	if (!pb?.authStore?.isValid || !pb.authStore.model?.id) {
		return new Response(JSON.stringify({ ok: false, error: 'not-authenticated' }), {
			status: 401,
			headers
		});
	}

	try {
		const { options, svg } = await request.json();
		if (!options || !svg) {
			return new Response(JSON.stringify({ ok: false, error: 'invalid-payload' }), {
				status: 400,
				headers
			});
		}

		const [montureId, brancheId] = await Promise.all([
			resolveMaterialId(pb, options.materialFrame),
			resolveMaterialId(pb, options.materialTemples)
		]);

		const lunette = await pb.collection('lunette').create({
			code_svg: svg,
			largeur_pont: options.bridge,
			taille_verre: options.lensSize,
			prix_final: options.price,
			gravure: options.engraveText || '',
			position_gravure: options.engraveSide,
			finition: options.finish,
			couleur_verre: options.lensColor,
			Materiaux_monture: montureId,
			Materiaux_branche: brancheId
		});

		await pb.collection('Compose').create({
			IdLunette: lunette.id,
			IdUsers: pb.authStore.model.id
		});

		return new Response(JSON.stringify({ ok: true, id: lunette.id }), {
			status: 200,
			headers
		});
	} catch (error: any) {
		console.error('save-composition error', error);
		return new Response(JSON.stringify({ ok: false, error: error?.message || 'internal-error' }), {
			status: 500,
			headers
		});
	}
};
