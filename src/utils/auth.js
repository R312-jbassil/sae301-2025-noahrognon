import PocketBase from 'pocketbase'
import { PB_BASE_URL } from './pb.js'

const SECURE_COOKIE = import.meta.env.MODE !== 'development'
const DEFAULT_COOKIE_DOMAIN = SECURE_COOKIE ? 'lunette.noahrognon.fr' : undefined
const SAME_SITE = SECURE_COOKIE ? 'None' : 'Lax'

export const AUTH_COOKIE_NAME = 'pb_auth'
export const OAUTH_COOKIE_NAME = 'pb_oauth_state'

const createClient = () => new PocketBase(PB_BASE_URL)

const normaliseHost = (host) => (host ? host.replace(/:\d+$/, '').toLowerCase() : undefined)

export const resolveCookieDomain = (request) => {
	if (!SECURE_COOKIE) return undefined

	const explicitEnv = import.meta.env.PUBLIC_COOKIE_DOMAIN?.trim()
	if (explicitEnv) return explicitEnv.toLowerCase()

	if (!request) return DEFAULT_COOKIE_DOMAIN

	if (typeof request === 'string') return normaliseHost(request)

	const headers = request.headers
	const forwardedHost = headers?.get?.('x-forwarded-host')
	const candidate = forwardedHost ? forwardedHost.split(',')[0]?.trim() : undefined
	const host = candidate || headers?.get?.('host')
	return normaliseHost(host) ?? DEFAULT_COOKIE_DOMAIN
}

export const exportAuthCookie = (client, domain) =>
	client
		? client.authStore.exportToCookie({
				name: AUTH_COOKIE_NAME,
				httpOnly: true,
				secure: SECURE_COOKIE,
				sameSite: SAME_SITE.toLowerCase(),
				path: '/',
				...(domain ? { domain } : {})
		  })
		: ''

const formatCookie = (name, value, domain, extras = []) => {
	const parts = [`${name}=${value}`, 'Path=/', ...extras]
	if (domain) parts.push(`Domain=${domain}`)
	if (SECURE_COOKIE) parts.push('Secure')
	parts.push(`SameSite=${SAME_SITE}`)
	parts.push('HttpOnly')
	return parts.join('; ') + ';'
}

export const clearAuthCookie = (domain) =>
	formatCookie(AUTH_COOKIE_NAME, '', domain, ['Expires=Thu, 01 Jan 1970 00:00:00 GMT'])

export const exportOAuthStateCookie = (value, domain) => {
	const encoded = encodeURIComponent(JSON.stringify(value))
	return formatCookie(OAUTH_COOKIE_NAME, encoded, domain, [`Max-Age=${60 * 10}`])
}

export const clearOAuthStateCookie = (domain) =>
	formatCookie(OAUTH_COOKIE_NAME, '', domain, ['Expires=Thu, 01 Jan 1970 00:00:00 GMT'])

export const splitCookieHeader = (cookieString) =>
	(cookieString || '')
		.split(/\r?\n/)
		.map((entry) => entry.trim())
		.filter(Boolean)

export const handleAuthFromCookies = async (request) => {
	const client = createClient()
	const cookie = request.headers.get('cookie') ?? ''
	client.authStore.loadFromCookie(cookie, AUTH_COOKIE_NAME)

	const domain = resolveCookieDomain(request)
	let authCookie = null

	try {
		if (client.authStore.isValid) {
			await client.collection('users').authRefresh()
			authCookie = exportAuthCookie(client, domain)
		}
	} catch (error) {
		console.error('Auth refresh failed:', error)
		client.authStore.clear()
		authCookie = clearAuthCookie(domain)
	}

	return { pb: client, authCookie, cookieDomain: domain }
}
