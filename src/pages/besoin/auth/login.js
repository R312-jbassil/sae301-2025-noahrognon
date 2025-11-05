import { createPocketBase } from '../../../utils/pb.js';
import { exportAuthCookie } from '../../../utils/auth.js';

export const prerender = false;

const parseRequestBody = async (request) => {
	try {
		const text = await request.text();
		return text ? JSON.parse(text) : {};
	} catch (error) {
		console.error('Invalid JSON body:', error);
		return {};
	}
};

export const POST = async ({ request }) => {
	const { email, password } = await parseRequestBody(request);

	if (!email || !password) {
		return new Response(JSON.stringify({ error: 'Identifiants requis.' }), {
			status: 400
		});
	}

	const pb = createPocketBase();

	try {
		const authData = await pb.collection('users').authWithPassword(email, password);
		const cookie = exportAuthCookie(pb);

		return new Response(JSON.stringify({ user: authData.record }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Set-Cookie': cookie
			}
		});
	} catch (error) {
		console.error('Login failed:', error);
		return new Response(JSON.stringify({ error: 'Identifiants invalides.' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
