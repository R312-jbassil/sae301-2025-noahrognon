import type { APIRoute } from 'astro';
import { createPocketBaseClient } from '../../utils/pb.js';

export const prerender = false;

const isPocketBaseId = (value: string) => /^[a-z0-9]{15}$/i.test(value);
const escapeFilterValue = (value: string) => value.replace(/"/g, '\\"');

async function resolveMaterialIdByLabel(pb: any, value: string) {
	const filter = `libelle="${escapeFilterValue(value)}"`;
	try {
		const record = await pb.collection('Materiaux').getFirstListItem(filter);
		return record?.id ?? null;
	} catch {
		return null;
	}
}

async function resolveMaterialId(
	pb: any,
	idValue?: string | null,
	codeValue?: string | null,
	labelValue?: string | null
) {
	const candidate = idValue ?? codeValue ?? labelValue ?? null;
	if (!candidate) return null;
	if (isPocketBaseId(candidate)) return candidate;

	const lookup = labelValue ?? codeValue ?? candidate;
	return resolveMaterialIdByLabel(pb, lookup);
}

const buildPayload = (options: any, montureId: string, brancheId: string, svg: string) => ({
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
		const { options, svg, editId } = await request.json();
		if (!options || !svg) {
			return new Response(JSON.stringify({ ok: false, error: 'invalid-payload' }), {
				status: 400,
				headers
			});
		}

		const [montureId, brancheId] = await Promise.all([
			resolveMaterialId(pb, options.materialFrameId, options.materialFrame, options.materialFrameLabel),
			resolveMaterialId(
				pb,
				options.materialTemplesId,
				options.materialTemples,
				options.materialTemplesLabel
			)
		]);

		if (!montureId || !brancheId) {
			return new Response(JSON.stringify({ ok: false, error: 'material-not-found' }), {
				status: 400,
				headers
			});
		}

		const data = buildPayload(options, montureId, brancheId, svg);

		let lunetteId = editId ?? null;

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

			await pb.collection('lunette').update(editId, data);
			lunetteId = editId;
		} else {
			const lunette = await pb.collection('lunette').create(data);
			lunetteId = lunette.id;

			await pb.collection('Compose').create({
				IdLunette: lunette.id,
				IdUsers: userId
			});
		}

		const existingOrder = await pb
			.collection('Commande')
			.getFirstListItem(
				`IdUtilisateur="${escapeFilterValue(userId)}" && IdLunette="${escapeFilterValue(lunetteId!)}"`,
				{ fields: 'id' }
			)
			.catch(() => null);

		if (existingOrder) {
			return new Response(JSON.stringify({ ok: false, error: 'already-ordered' }), {
				status: 409,
				headers
			});
		}

		const commande = await pb.collection('Commande').create({
			IdUtilisateur: userId,
			IdLunette: lunetteId,
			total: options.price
		});

		return new Response(
			JSON.stringify({
				ok: true,
				orderId: commande.id,
				lunetteId
			}),
			{
				status: 200,
				headers
			}
		);
	} catch (error: any) {
		console.error('create-order error', error);
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
