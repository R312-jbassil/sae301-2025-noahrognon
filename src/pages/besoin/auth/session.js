import {
	handleAuthFromCookies,
	exportAuthCookie,
	clearAuthCookie,
	resolveCookieDomain,
	applyCookies
} from '../../../utils/auth.js'
import PocketBase from 'pocketbase'
import { PB_BASE_URL } from '../../../utils/pb.js'

export const prerender = false

const createClient = () => new PocketBase(PB_BASE_URL)

export const GET = async ({ request, cookies }) => {
	const { pb, authCookie, cookieDomain } = await handleAuthFromCookies(request)

	if (!pb.authStore?.isValid || !pb.authStore.model) {
		applyCookies(cookies, clearAuthCookie(cookieDomain))
		return new Response(JSON.stringify({ user: null }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	const refreshedCookie = authCookie ?? exportAuthCookie(pb, cookieDomain)
	applyCookies(cookies, refreshedCookie)

	return new Response(JSON.stringify({ user: pb.authStore.model }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
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

		const domain = resolveCookieDomain(request)
		const cookie = exportAuthCookie(pb, domain)
		applyCookies(cookies, cookie)

		return new Response(JSON.stringify({ ok: true, user: pb.authStore.model }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('session post error', error)
		const domain = resolveCookieDomain(request)
		applyCookies(cookies, clearAuthCookie(domain))
		return new Response(JSON.stringify({ ok: false, error: 'invalid-session' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}
