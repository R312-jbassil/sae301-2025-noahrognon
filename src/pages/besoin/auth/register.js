import PocketBase from 'pocketbase'
import { exportAuthCookie } from '../../../utils/auth.js'
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

export const POST = async ({ request }) => {
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

		const authData = await pb.collection('users').authWithPassword(email, password)
		const cookie = exportAuthCookie(pb)

		return new Response(JSON.stringify({ user: authData.record }), {
			status: 201,
			headers: {
				'Content-Type': 'application/json',
				'Set-Cookie': cookie
			}
		})
	} catch (error) {
		console.error('Register failed:', error)
		return new Response(JSON.stringify({ error: 'Impossible de creer le compte.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

