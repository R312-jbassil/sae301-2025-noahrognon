import { Collections } from '../../utils/pocketbase-types.js'
import { createPocketBaseClient, isRequestSecure } from '../../utils/pb.js'

export const prerender = false

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

const parseExportedCookie = (exportValue) => {
	if (!exportValue) return null
	const [pair] = exportValue.split(';')
	const [, value] = pair.split('=')
	return value ?? null
}

export const POST = async ({ request, cookies }) => {
	let body = {}
	try {
		body = await request.json()
	} catch {
		return new Response(JSON.stringify({ error: 'invalid-payload' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	const email = body?.email?.toString().trim()
	const password = body?.password?.toString() ?? ''

	if (!email || !password) {
		return new Response(JSON.stringify({ error: 'missing-credentials' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	const pb = createPocketBaseClient()

	try {
		const authData = await pb.collection(Collections.Users).authWithPassword(email, password)
		const exported = pb.authStore.exportToCookie()
		const value = parseExportedCookie(exported)

		if (!value) {
			throw new Error('invalid-cookie-export')
		}

		cookies.set('pb_auth', value, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: isRequestSecure(request),
			maxAge: COOKIE_MAX_AGE
		})

		return new Response(JSON.stringify({ user: authData.record }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('Erreur de connexion :', error)
		return new Response(JSON.stringify({ error: 'Identifiants invalides' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}
