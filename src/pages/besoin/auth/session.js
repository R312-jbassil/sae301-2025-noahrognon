import {
	handleAuthFromCookies,
	exportAuthCookie,
	clearAuthCookie
} from '../../../utils/auth.js'
import PocketBase from 'pocketbase'
import { PB_BASE_URL } from '../../../utils/pb.js'

export const prerender = false

const createClient = () => new PocketBase(PB_BASE_URL)

export const GET = async ({ request }) => {
	const { pb, authCookie } = await handleAuthFromCookies(request)

	if (!pb.authStore?.isValid || !pb.authStore.model) {
		return new Response(JSON.stringify({ user: null }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Set-Cookie': clearAuthCookie()
			}
		})
	}

	const refreshedCookie = authCookie ?? exportAuthCookie(pb)

	const headers = new Headers({ 'Content-Type': 'application/json' })
	const cookieParts = refreshedCookie ? refreshedCookie.split(/\r?\n/).filter(Boolean) : []
	cookieParts.forEach((c) => headers.append('Set-Cookie', c))

	return new Response(JSON.stringify({ user: pb.authStore.model }), {
		status: 200,
		headers
	})
}

export const POST = async ({ request }) => {
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

		const cookie = exportAuthCookie(pb)
		return new Response(JSON.stringify({ ok: true, user: pb.authStore.model }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Set-Cookie': cookie
			}
		})
	} catch (error) {
		console.error('session post error', error)
		return new Response(JSON.stringify({ ok: false, error: 'invalid-session' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearAuthCookie() }
		})
	}
}

