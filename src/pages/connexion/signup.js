import { Collections } from '../../utils/pocketbase-types.js'
import { createPocketBaseClient, isRequestSecure } from '../../utils/pb.js'

export const prerender = false

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

const parseExportedCookie = (exportValue) => {
	if (!exportValue) return null
	const [pair] = exportValue.split(';')
	const [, value] = pair.split('=')
	return value ?? null
}

const parseBody = async (request) => {
	try {
		const json = await request.json()
		return typeof json === 'object' && json !== null ? json : {}
	} catch {
		return {}
	}
}

export const POST = async ({ request, cookies }) => {
	const body = await parseBody(request)
	const email = body?.email?.toString().trim()
	const password = body?.password?.toString() ?? ''
	const passwordConfirm = body?.passwordConfirm?.toString() ?? ''
	const name = body?.name?.toString().trim()
	const telephone = body?.telephone?.toString().trim() ?? ''
	const age = body?.age ?? null
	const commande = Number(body?.commande) || 0
	const creation = Number(body?.creation) || 0
	const fidelite = Number(body?.fidelite) || 0
	const premium = Boolean(body?.premium)

	if (!email || !password || !passwordConfirm || !name) {
		return new Response(JSON.stringify({ error: 'missing-fields' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	if (password !== passwordConfirm) {
		return new Response(JSON.stringify({ error: 'password-mismatch' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	const pb = createPocketBaseClient()

	try {
		await pb.collection(Collections.Users).create({
			email,
			password,
			passwordConfirm,
			name,
			telephone,
			age,
			commande,
			creation,
			fidelite,
			premium
		})

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
		console.error('Erreur de création de compte :', error)
		return new Response(JSON.stringify({ error: 'signup-failed' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}
