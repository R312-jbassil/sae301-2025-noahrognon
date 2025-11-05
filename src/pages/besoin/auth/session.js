import {
	handleAuthFromCookies,
	exportAuthCookie,
	clearAuthCookie
} from '../../../utils/auth.js';
import { createPocketBase } from '../../../utils/pb.js';

export const prerender = false;

export const GET = async ({ request }) => {
	const { pb, authCookie } = await handleAuthFromCookies(request);

	if (!pb.authStore?.isValid || !pb.authStore.model) {
		return new Response(JSON.stringify({ user: null }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Set-Cookie': clearAuthCookie()
			}
		});
	}

	const refreshedCookie = authCookie ?? exportAuthCookie(pb);

	return new Response(JSON.stringify({ user: pb.authStore.model }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Set-Cookie': refreshedCookie
		}
	});
};

export const POST = async ({ request }) => {
	try {
		const { token, model } = await request.json();
		if (!token || !model) {
			return new Response(JSON.stringify({ ok: false, error: 'invalid-payload' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const pb = createPocketBase();
		pb.authStore.save(token, model);

		if (!pb.authStore.isValid) {
			throw new Error('invalid-token');
		}

		const cookie = exportAuthCookie(pb);
		return new Response(JSON.stringify({ ok: true, user: pb.authStore.model }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Set-Cookie': cookie
			}
		});
	} catch (error) {
		console.error('session post error', error);
		return new Response(JSON.stringify({ ok: false, error: 'invalid-session' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearAuthCookie() }
		});
	}
};
