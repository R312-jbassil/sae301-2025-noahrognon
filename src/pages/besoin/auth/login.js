import PocketBase from 'pocketbase'
import { applyCookies, exportAuthCookie, resolveCookieDomain } from '../../../utils/auth.js'
import { PB_BASE_URL } from '../../../utils/pb.js'

export const prerender = false

const parseRequestBody = async (request) => {
	try {
		const text = await request.text()
		return text ? JSON.parse(text) : {}
	} catch (error) {
		console.error('Invalid JSON body:', error)
		return {}
	}
}

const createClient = () => new PocketBase(PB_BASE_URL)

export const POST = async ({ request, cookies }) => {
	const { email, password } = await parseRequestBody(request)

	if (!email || !password) {
		return new Response(JSON.stringify({ error: 'Identifiants requis.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	const pb = createClient()

	try {
		await pb.collection('users').authWithPassword(email, password)
		const domain = resolveCookieDomain(request)
		const cookie = exportAuthCookie(pb, domain)
		applyCookies(cookies, cookie)

		const redirect = new URL(request.url).searchParams.get('redirect') ?? '/mon-compte'
		const headers = new Headers()
		headers.set('Location', redirect)

		return new Response(null, {
			status: 303,
			headers
		})
	} catch (error) {
		console.error('Login failed:', error)
		return new Response(JSON.stringify({ error: 'Identifiants invalides.' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}
