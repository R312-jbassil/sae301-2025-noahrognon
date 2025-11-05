import PocketBase from 'pocketbase'
import { PB_BASE_URL } from './pb.js'

const isProduction = import.meta.env.MODE !== 'development'
const DEFAULT_COOKIE_DOMAIN = 'lunette.noahrognon.fr'

export const AUTH_COOKIE_NAME = 'pb_auth'
export const OAUTH_COOKIE_NAME = 'pb_oauth_state'

const createClient = () => new PocketBase(PB_BASE_URL)

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

const normaliseHost = (host) => (host ? host.replace(/:\d+$/, '').toLowerCase() : undefined)

const getHeader = (request, name) => {
	if (!request || typeof request === 'string') return undefined
	return request.headers?.get?.(name) ?? undefined
}

const firstHeaderToken = (value) => value?.split(',')?.[0]?.trim() ?? undefined

const detectProto = (request) => {
	const forwardedProto = firstHeaderToken(getHeader(request, 'x-forwarded-proto'))
	if (forwardedProto) return forwardedProto.toLowerCase()

	if (typeof request === 'string') {
		if (request.startsWith('https')) return 'https'
		if (request.startsWith('http')) return 'http'
		return undefined
	}

	const url = request?.url
	if (typeof url === 'string') {
		if (url.startsWith('https:')) return 'https'
		if (url.startsWith('http:')) return 'http'
	}

	return undefined
}

export const resolveCookieConfig = (request) => {
	const explicitEnv = import.meta.env.PUBLIC_COOKIE_DOMAIN?.trim()?.toLowerCase() ?? null

	const proto = detectProto(request)
	const secure = proto ? proto === 'https' : isProduction
	const sameSite = secure ? 'None' : 'Lax'

	const forwardedHost = normaliseHost(firstHeaderToken(getHeader(request, 'x-forwarded-host')))
	const hostHeader = normaliseHost(getHeader(request, 'host'))
	const fallbackHost = typeof request === 'string' ? normaliseHost(request) : undefined

	const rawDomain =
		explicitEnv ??
		(forwardedHost && forwardedHost !== 'localhost' ? forwardedHost : undefined) ??
		(hostHeader && hostHeader !== 'localhost' ? hostHeader : undefined) ??
		(fallbackHost && fallbackHost !== 'localhost' ? fallbackHost : undefined) ??
		(secure ? DEFAULT_COOKIE_DOMAIN : undefined)

	const domain = explicitEnv || (rawDomain && rawDomain !== 'localhost' ? rawDomain : undefined)

	return { secure, sameSite, domain }
}

export const exportAuthCookie = (client, config = resolveCookieConfig()) => {
	if (!client) return ''
	const { secure, sameSite, domain } = config
	return client.authStore.exportToCookie({
		name: AUTH_COOKIE_NAME,
		httpOnly: true,
		secure,
		sameSite: (sameSite ?? (secure ? 'None' : 'Lax')).toLowerCase(),
		path: '/',
		...(domain ? { domain } : {})
	})
}

const formatCookie = (name, value, config, extras = []) => {
	const { secure, sameSite, domain } = config
	const normalisedSameSite = (sameSite ?? (secure ? 'None' : 'Lax')).toLowerCase()
	const sameSiteLabel =
		normalisedSameSite === 'none'
			? 'None'
			: normalisedSameSite === 'strict'
			? 'Strict'
			: 'Lax'

	const parts = [`${name}=${value}`, 'Path=/', ...extras]
	if (domain) parts.push(`Domain=${domain}`)
	if (secure) parts.push('Secure')
	parts.push(`SameSite=${sameSiteLabel}`)
	parts.push('HttpOnly')
	return parts.join('; ') + ';'
}

export const clearAuthCookie = (config) =>
	formatCookie(AUTH_COOKIE_NAME, '', config, ['Expires=Thu, 01 Jan 1970 00:00:00 GMT'])

export const exportOAuthStateCookie = (value, config) => {
	const encoded = encodeURIComponent(JSON.stringify(value))
	return formatCookie(OAUTH_COOKIE_NAME, encoded, config, [`Max-Age=${60 * 10}`])
}

export const clearOAuthStateCookie = (config) =>
	formatCookie(OAUTH_COOKIE_NAME, '', config, ['Expires=Thu, 01 Jan 1970 00:00:00 GMT'])

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
	const cookieHeader = request.headers.get('cookie') ?? ''
	client.authStore.loadFromCookie(cookieHeader, AUTH_COOKIE_NAME)

	const config = resolveCookieConfig(request)
	let authCookie = null

	try {
		if (client.authStore.isValid) {
			await client.collection('users').authRefresh()
			authCookie = exportAuthCookie(client, config)
		}
	} catch (error) {
		console.error('Auth refresh failed:', error)
		client.authStore.clear()
		authCookie = clearAuthCookie(config)
	}

	return { pb: client, authCookie, cookieConfig: config }
}
