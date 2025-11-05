import { applyCookies, clearAuthCookie, resolveCookieDomain } from '../../../utils/auth.js'

export const prerender = false

export const POST = async ({ request, cookies }) => {
	const domain = resolveCookieDomain(request)
	const cookie = clearAuthCookie(domain)
	applyCookies(cookies, cookie)

	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	})
}
