import {
	handleAuthFromCookies,
	exportAuthCookie,
	clearAuthCookie,
	resolveCookieConfig,
	applyCookies,
	splitCookieHeader
} from '../../../utils/auth.js'
import { createPocketBaseClient } from '../../../utils/pb.js'

export const prerender = false

const createClient = () => createPocketBaseClient()

export const GET = async ({ request, cookies }) => {
	const { pb, authCookie, cookieConfig } = await handleAuthFromCookies(request)

	const headers = new Headers({ 'Content-Type': 'application/json' })

	if (!pb.authStore?.isValid || !pb.authStore.model) {
		const cleared = clearAuthCookie(cookieConfig)
		applyCookies(cookies, cleared)
		for (const entry of splitCookieHeader(cleared)) {
			headers.append('Set-Cookie', entry)
		}
		return new Response(JSON.stringify({ user: null }), {
			status: 200,
			headers
		})
	}

	const refreshedCookie = authCookie ?? exportAuthCookie(pb, cookieConfig)
	applyCookies(cookies, refreshedCookie)
	for (const entry of splitCookieHeader(refreshedCookie)) {
		headers.append('Set-Cookie', entry)
	}

	return new Response(JSON.stringify({ user: pb.authStore.model }), {
		status: 200,
		headers
	})
}

export const POST = async ({ request, cookies }) => {
	try {
		const { token, model } = await request.json()
		if (!token || !model) {
			return new Response(JSON.stringify({ ok: false, error: 'invalid-payload' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			})
		}

		const pb = createClient()
		pb.authStore.save(token, model)

		if (!pb.authStore.isValid) {
			throw new Error('invalid-token')
		}

		const config = resolveCookieConfig(request)
		const cookie = exportAuthCookie(pb, config)
		applyCookies(cookies, cookie)

		const headers = new Headers({ 'Content-Type': 'application/json' })
		for (const entry of splitCookieHeader(cookie)) {
			headers.append('Set-Cookie', entry)
		}

		return new Response(JSON.stringify({ ok: true, user: pb.authStore.model }), {
			status: 200,
			headers
		})
	} catch (error) {
		console.error('session post error', error)
		const config = resolveCookieConfig(request)
		const cleared = clearAuthCookie(config)
		applyCookies(cookies, cleared)
		const headers = new Headers({ 'Content-Type': 'application/json' })
		for (const entry of splitCookieHeader(cleared)) {
			headers.append('Set-Cookie', entry)
		}
		return new Response(JSON.stringify({ ok: false, error: 'invalid-session' }), {
			status: 401,
			headers
		})
	}
}
