import { clearAuthCookie, resolveCookieDomain, splitCookieHeader } from '../../../utils/auth.js'

export const prerender = false

export const POST = async ({ request }) => {
	const domain = resolveCookieDomain(request)
	const cookie = clearAuthCookie(domain)
	const headers = new Headers({ 'Content-Type': 'application/json' })
	splitCookieHeader(cookie).forEach((c) => headers.append('Set-Cookie', c))

	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers
	})
}
