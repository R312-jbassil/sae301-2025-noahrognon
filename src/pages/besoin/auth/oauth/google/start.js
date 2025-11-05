import { createPocketBase } from '../../../../../utils/pb.js';
import { exportOAuthStateCookie } from '../../../../../utils/auth.js';

export const prerender = false;

export const GET = async ({ request, url }) => {
	const redirect = url.searchParams.get('redirect') ?? '/mon-compte';
	const pb = createPocketBase();

	try {
		const authMethods = await pb.collection('users').listAuthMethods();
		const provider =
			authMethods?.oauth2?.providers?.find(
				(item) => item.name === 'google' || item.name === 'Google'
			) ?? null;

		if (!provider) {
			const headers = new Headers();
			headers.set('Location', `/login?error=${encodeURIComponent('Connexion Google indisponible.')}`);
			return new Response(null, { status: 302, headers });
		}

		const callbackUrl = `${url.origin}/api/auth/oauth/google/callback`;
		const providerName = provider.name ?? provider.provider ?? 'google';

		const statePayload = {
			state: provider.state,
			codeVerifier: provider.codeVerifier,
			provider: providerName,
			redirect,
			callbackUrl
		};

		const cookie = exportOAuthStateCookie(statePayload);

		return new Response(null, {
			status: 302,
			headers: {
				Location: `${provider.authUrl}${encodeURIComponent(callbackUrl)}`,
				'Set-Cookie': cookie
			}
		});
	} catch (error) {
		console.error('OAuth start failed:', error);
		return new Response('Erreur lors de la pr&eacute;paration OAuth.', { status: 500 });
	}
};
