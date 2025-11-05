import PocketBase from 'pocketbase'
import { PB_BASE_URL } from './pb.js'

const ensureHeadersPolyfill = () => {
	if (typeof Headers === 'undefined') return

	const proto = Headers.prototype
	if (typeof proto.getSetCookie === 'function') return

	proto.getSetCookie = function () {
		const header = this.get('set-cookie')
		if (!header) return []
		if (Array.isArray(header)) return header
		return header
			.split(/\r?\n/)
			.flatMap((line) => line.split(/,(?=\s*[A-Za-z0-9-_]+=)/))
			.map((item) => item.trim())
			.filter(Boolean)
	}
}

ensureHeadersPolyfill()

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

const parseAttribute = (segment) => {
	const [rawKey, ...rawValueParts] = segment.split('=')
	const key = rawKey.trim().toLowerCase()
	const value = rawValueParts.join('=').trim()
	return { key, value }
}

export const parseSetCookie = (cookieEntry) => {
	if (!cookieEntry) return null
	const segments = cookieEntry.split(';').map((seg) => seg.trim()).filter(Boolean)
	if (segments.length === 0) return null

	const [nameValue, ...rest] = segments
	const eqIdx = nameValue.indexOf('=')
	if (eqIdx === -1) return null

	const name = nameValue.slice(0, eqIdx)
	const value = nameValue.slice(eqIdx + 1)
	const options = {}

	for (const segment of rest) {
		const { key, value: attrValue } = parseAttribute(segment)
		switch (key) {
			case 'path':
				options.path = attrValue || '/'
				break
			case 'domain':
				options.domain = attrValue || undefined
				break
			case 'expires': {
				const date = new Date(attrValue)
				if (!Number.isNaN(date.valueOf())) options.expires = date
				break
			}
			case 'max-age':
				options.maxAge = Number(attrValue) || undefined
				break
			case 'samesite':
				options.sameSite = attrValue ? attrValue.toLowerCase() : undefined
				break
			case 'secure':
				options.secure = true
				break
			case 'httponly':
				options.httpOnly = true
				break
			default:
				break
		}
	}

	return { name, value, options }
}

export const applyCookies = (cookies, cookieString) => {
	if (!cookies || !cookieString) return
	for (const entry of splitCookieHeader(cookieString)) {
		const parsed = parseSetCookie(entry)
		if (parsed) {
			cookies.set(parsed.name, parsed.value, parsed.options)
		}
	}
}

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
