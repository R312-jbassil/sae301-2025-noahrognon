import { applyCookies, clearAuthCookie, resolveCookieConfig, splitCookieHeader } from '../../../utils/auth.js'

export const prerender = false

export const POST = async ({ request, cookies }) => {
	const config = resolveCookieConfig(request)
	const cookie = clearAuthCookie(config)
	applyCookies(cookies, cookie)

	const headers = new Headers({ 'Content-Type': 'application/json' })
	for (const entry of splitCookieHeader(cookie)) {
		headers.append('Set-Cookie', entry)
	}

	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers
	})
}
