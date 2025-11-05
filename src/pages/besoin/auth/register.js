import PocketBase from 'pocketbase'
import { applyCookies, exportAuthCookie, resolveCookieConfig, splitCookieHeader } from '../../../utils/auth.js'
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
	const {
		email,
		password,
		passwordConfirm,
		name,
		telephone,
		age,
		commande = 0,
		creation = 0,
		fidelite = 0,
		premium = false
	} = await parseRequestBody(request)

	if (!email || !password || !passwordConfirm || !name) {
		return new Response(JSON.stringify({ error: 'Les champs requis sont manquants.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	if (password !== passwordConfirm) {
		return new Response(JSON.stringify({ error: 'Les mots de passe ne correspondent pas.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	const pb = createClient()

	try {
		await pb.collection('users').create({
			email,
			password,
			passwordConfirm,
			name,
			telephone: telephone ?? '',
			age: age ?? null,
			commande,
			creation,
			fidelite,
			premium
		})

		await pb.collection('users').authWithPassword(email, password)
		const config = resolveCookieConfig(request)
		const cookie = exportAuthCookie(pb, config)
		applyCookies(cookies, cookie)

		const redirect = new URL(request.url).searchParams.get('redirect') ?? '/mon-compte'
		const headers = new Headers({ 'Content-Type': 'application/json' })
		for (const entry of splitCookieHeader(cookie)) {
			headers.append('Set-Cookie', entry)
		}

		return new Response(JSON.stringify({ ok: true, redirect }), {
			status: 200,
			headers
		})
	} catch (error) {
		console.error('Register failed:', error)
		return new Response(JSON.stringify({ error: 'Impossible de creer le compte.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}
