import { clearOAuthStateCookie, exportAuthCookie, OAUTH_COOKIE_NAME } from '../../../../../utils/auth.js';
import { createPocketBase } from '../../../../../utils/pb.js';

export const prerender = false;

const parseOAuthCookie = (cookieHeader) => {
	if (!cookieHeader) return null;
	const cookies = cookieHeader.split(';').map((chunk) => chunk.trim());
	const target = cookies.find((item) => item.startsWith(`${OAUTH_COOKIE_NAME}=`));
	if (!target) return null;
	try {
		return JSON.parse(decodeURIComponent(target.split('=').slice(1).join('=')));
	} catch {
		return null;
	}
};

export const GET = async ({ request, url }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const error = url.searchParams.get('error');

	const oauthCookie = parseOAuthCookie(request.headers.get('cookie'));

	if (error) {
		console.error('OAuth callback error:', error);
		return new Response(null, {
			status: 302,
			headers: {
				Location: `/login?error=${encodeURIComponent('Connexion annul&eacute;e.')}`,
				'Set-Cookie': clearOAuthStateCookie()
			}
		});
	}

	if (!code || !state || !oauthCookie || oauthCookie.state !== state) {
		return new Response(null, {
			status: 302,
			headers: {
				Location: `/login?error=${encodeURIComponent('Validation OAuth invalide.')}`,
				'Set-Cookie': clearOAuthStateCookie()
			}
		});
	}

	const pb = createPocketBase();

	try {
		await pb.collection('users').authWithOAuth2({
			provider: oauthCookie.provider,
			code,
			codeVerifier: oauthCookie.codeVerifier,
			redirectUrl: oauthCookie.callbackUrl
		});

		const authCookie = exportAuthCookie(pb);
		const headers = new Headers();
		headers.set('Location', oauthCookie.redirect ?? '/mon-compte');
		headers.append('Set-Cookie', authCookie);
		headers.append('Set-Cookie', clearOAuthStateCookie());

		return new Response(null, {
			status: 302,
			headers
		});
	} catch (err) {
		console.error('OAuth callback exchange failed:', err);
		return new Response(null, {
			status: 302,
			headers: {
				Location: `/login?error=${encodeURIComponent('Impossible de finaliser la connexion Google.')}`,
				'Set-Cookie': clearOAuthStateCookie()
			}
		});
	}
};
