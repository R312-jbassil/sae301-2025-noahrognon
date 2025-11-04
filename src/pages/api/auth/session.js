import { handleAuthFromCookies, exportAuthCookie, clearAuthCookie } from '../../../utils/auth.js';

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
