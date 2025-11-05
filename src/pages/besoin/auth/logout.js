import { clearAuthCookie, splitCookieHeader } from '../../../utils/auth.js'

export const prerender = false

export const POST = async () => {
	const cookie = clearAuthCookie()
	const headers = new Headers({ 'Content-Type': 'application/json' })
	splitCookieHeader(cookie).forEach((c) => headers.append('Set-Cookie', c))

	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers
	})
}
