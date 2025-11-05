import PocketBase from "pocketbase"
import { PB_BASE_URL } from "./pb.js"

const SECURE_COOKIE = import.meta.env.MODE !== 'development'
const COOKIE_DOMAIN = SECURE_COOKIE ? 'lunette.noahrognon.fr' : undefined
const SAME_SITE = SECURE_COOKIE ? 'None' : 'Lax'

export const AUTH_COOKIE_NAME = 'pb_auth'
export const OAUTH_COOKIE_NAME = 'pb_oauth_state'

const createClient = () => new PocketBase(PB_BASE_URL)

export const exportAuthCookie = (client) =>
	client
		? client.authStore.exportToCookie({
				name: AUTH_COOKIE_NAME,
				httpOnly: true,
				secure: SECURE_COOKIE,
				sameSite: SAME_SITE.toLowerCase(),
				path: '/',
				...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {})
		  })
		: ''

const formatCookie = (name, value, extras = []) => {
	const parts = [
		`${name}=${value}`,
		'Path=/',
		...extras
	]
	if (COOKIE_DOMAIN) parts.push(`Domain=${COOKIE_DOMAIN}`)
	if (SECURE_COOKIE) parts.push('Secure')
	parts.push(`SameSite=${SAME_SITE}`)
	parts.push('HttpOnly')
	return parts.join('; ') + ';'
}

export const clearAuthCookie = () =>
	formatCookie(AUTH_COOKIE_NAME, '', ['Expires=Thu, 01 Jan 1970 00:00:00 GMT'])

export const exportOAuthStateCookie = (value) => {
	const encoded = encodeURIComponent(JSON.stringify(value))
	return formatCookie(OAUTH_COOKIE_NAME, encoded, [`Max-Age=${60 * 10}`])
}

export const clearOAuthStateCookie = () =>
	formatCookie(OAUTH_COOKIE_NAME, '', ['Expires=Thu, 01 Jan 1970 00:00:00 GMT'])

export const splitCookieHeader = (cookieString) =>
	(cookieString || '')
		.split(/\r?\n/)
		.map((entry) => entry.trim())
		.filter(Boolean)

export const handleAuthFromCookies = async (request) => {
	const client = createClient()
	const cookie = request.headers.get('cookie') ?? ''
	client.authStore.loadFromCookie(cookie, AUTH_COOKIE_NAME)

	let authCookie = null

	try {
		if (client.authStore.isValid) {
			await client.collection('users').authRefresh()
			authCookie = exportAuthCookie(client)
		}
	} catch (error) {
		console.error('Auth refresh failed:', error)
		client.authStore.clear()
		authCookie = clearAuthCookie()
	}

	return { pb: client, authCookie }
}
