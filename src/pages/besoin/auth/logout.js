import { clearAuthCookie } from '../../../utils/auth.js';

export const prerender = false;

export const POST = async () => {
	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Set-Cookie': clearAuthCookie()
		}
	});
};
