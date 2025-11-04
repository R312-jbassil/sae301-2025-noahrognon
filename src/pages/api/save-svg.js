import { handleAuthFromCookies } from '../../utils/auth.js';

const escapeValue = (value = '') => value.replace(/"/g, '\\"');

const resolveMaterialId = async (pb, { id, slug, label }) => {
	if (id) return id;

	const collection = pb.collection('Materiaux');

	if (slug) {
		try {
			const record = await collection.getFirstListItem(`slug="${escapeValue(slug)}"`);
			return record?.id ?? null;
		} catch (error) {
			// ignore lookup failures and fall back to label
		}
	}

	if (label) {
		try {
			const record = await collection.getFirstListItem(`libelle="${escapeValue(label)}"`);
			return record?.id ?? null;
		} catch (error) {
			// ignore
		}
	}

	return null;
};

export const prerender = false;

const parseRequestBody = async (request) => {
	try {
		const text = await request.text();
		return text ? JSON.parse(text) : {};
	} catch (error) {
		console.error('Invalid JSON body', error);
		return {};
	}
};

export const POST = async ({ request }) => {
	const { pb, authCookie } = await handleAuthFromCookies(request);
	const headers = new Headers({ 'Content-Type': 'application/json' });
	if (authCookie) {
		headers.set('Set-Cookie', authCookie);
	}

	const body = await parseRequestBody(request);
	const userId = pb.authStore?.model?.id || body.userId;

	if (!userId) {
		return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
			status: 401,
			headers
		});
	}

	const frameMaterialId = await resolveMaterialId(pb, {
		id: body.Materiaux_monture,
		slug: body.frameSlug,
		label: body.frameLabel
	});

	const templeMaterialId = await resolveMaterialId(pb, {
		id: body.Materiaux_branche,
		slug: body.templeSlug,
		label: body.templeLabel
	});

	const lunettePayload = {
		code_svg: body.code_svg ?? '',
		largeur_pont: body.largeur_pont ?? null,
		taille_verre: body.taille_verre ?? null,
		couleur_verre: body.couleur_verre ?? '',
		finition: body.finition ?? '',
		gravure: body.gravure ?? '',
		position_gravure: body.position_gravure ?? '',
		style_gravure: body.style_gravure ?? '',
		Materiaux_monture: frameMaterialId,
		Materiaux_branche: templeMaterialId,
		prix_final: body.prix_final ?? 0
	};

	try {
		let lunetteId = body.lunetteId || null;

		if (lunetteId) {
			await pb.collection('lunette').update(lunetteId, lunettePayload);
		} else {
			const lunette = await pb.collection('lunette').create(lunettePayload);
			lunetteId = lunette.id;
			await pb.collection('Compose').create({
				IdLunette: lunetteId,
				IdUsers: userId
			});
		}

		let commandeId = null;
		if (body.orderNow) {
			const commande = await pb.collection('Commande').create({
				IdUtilisateur: userId,
				IdLunette: lunetteId,
				total: body.prix_final ?? 0
			});
			commandeId = commande.id;
		}

		return new Response(JSON.stringify({ ok: true, lunetteId, commandeId }), {
			status: 200,
			headers
		});
	} catch (error) {
		console.error('Save SVG endpoint error', error);
		return new Response(JSON.stringify({ ok: false, error: 'Save failed' }), {
			status: 500,
			headers
		});
	}
};
