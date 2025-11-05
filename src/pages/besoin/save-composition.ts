import type { APIRoute } from 'astro';
import { handleAuthFromCookies } from '../../utils/auth.js';

export const prerender = false;

const isPocketBaseId = (value: string) => /^[a-z0-9]{15}$/i.test(value);
const escapeFilterValue = (value: string) => value.replace(/"/g, '\\"');

async function resolveMaterialId(
	pb: any,
	idValue?: string | null,
	codeValue?: string | null,
	labelValue?: string | null
) {
	const primary = idValue ?? codeValue ?? labelValue;
	if (!primary) return null;
	if (isPocketBaseId(primary)) {
		return primary;
	}

	const candidate = labelValue ?? codeValue ?? primary;
	const filter = `libelle="${escapeFilterValue(candidate)}"`;

	try {
		const record = await pb.collection('Materiaux').getFirstListItem(filter);
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
		const { options, svg, editId } = await request.json();
		if (!options || !svg) {
			return new Response(JSON.stringify({ ok: false, error: 'invalid-payload' }), {
				status: 400,
				headers
			});
		}

		const userId = pb.authStore.model.id;

		const [montureId, brancheId] = await Promise.all([
			resolveMaterialId(pb, options.materialFrameId, options.materialFrame, options.materialFrameLabel),
			resolveMaterialId(pb, options.materialTemplesId, options.materialTemples, options.materialTemplesLabel)
		]);

		if (!montureId || !brancheId) {
			return new Response(JSON.stringify({ ok: false, error: 'material-not-found' }), {
				status: 400,
				headers
			});
		}

		const payload = {
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
		};

		if (editId) {
			const compose = await pb
				.collection('Compose')
				.getFirstListItem(
					`IdLunette="${escapeFilterValue(editId)}" && IdUsers="${escapeFilterValue(userId)}"`,
					{ fields: 'id' }
				)
				.catch(() => null);

			if (!compose) {
				return new Response(JSON.stringify({ ok: false, error: 'not-found' }), {
					status: 404,
					headers
				});
			}

			await pb.collection('lunette').update(editId, payload);

			return new Response(
				JSON.stringify({
					ok: true,
					id: editId,
					updated: true
				}),
				{ status: 200, headers }
			);
		}

		const lunette = await pb.collection('lunette').create(payload);

		await pb.collection('Compose').create({
			IdLunette: lunette.id,
			IdUsers: userId
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
