import { createPocketBaseClient } from '../utils/pb.js'

const AUTH_COOKIE_NAME = 'pb_auth'
const AUTH_WHITELISTED_API = new Set(['/v2/login', '/v2/signup'])
const PROTECTED_PATH_PREFIXES = ['/mon-compte', '/mes-creations', '/besoin']

const ensureGetSetCookiePolyfill = () => {
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

ensureGetSetCookiePolyfill()

const shouldProtectPath = (pathname) =>
	PROTECTED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

export const onRequest = async (context, next) => {
	const pb = createPocketBaseClient()

	const cookieValue = context.cookies.get(AUTH_COOKIE_NAME)?.value
	if (cookieValue) {
		try {
			pb.authStore.loadFromCookie(`${AUTH_COOKIE_NAME}=${cookieValue}`)
			if (pb.authStore.isValid) {
				context.locals.user = pb.authStore.record
			}
		} catch {
			pb.authStore.clear()
			context.cookies.delete(AUTH_COOKIE_NAME, { path: '/' })
		}
	}

	context.locals.pb = pb

	const pathname = context.url.pathname
	const isV2Route = pathname.startsWith('/v2/')

	if (isV2Route && !context.locals.user && !AUTH_WHITELISTED_API.has(pathname)) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	if (!context.locals.user && shouldProtectPath(pathname)) {
		if (pathname !== '/login' && pathname !== '/') {
			return Response.redirect(new URL('/login', context.url), 303)
		}
	}

	return next()
}
