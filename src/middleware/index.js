import { createPocketBaseClient } from '../utils/pb.js'

const AUTH_COOKIE_NAME = 'pb_auth'
const AUTH_WHITELISTED_API = new Set(['/api/login', '/api/signup'])
const PROTECTED_PATH_PREFIXES = ['/mon-compte', '/mes-creations', '/besoin']

const buildCookieString = (value) => {
	if (!value) return null
	return `${AUTH_COOKIE_NAME}=${value}`
}

const shouldProtectPath = (pathname) =>
	PROTECTED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

export const onRequest = async (context, next) => {
	const pb = createPocketBaseClient()

	const authCookie = context.cookies.get(AUTH_COOKIE_NAME)?.value ?? null
	if (authCookie) {
		try {
			pb.authStore.loadFromCookie(buildCookieString(authCookie))
		} catch {
			pb.authStore.clear()
			context.cookies.delete(AUTH_COOKIE_NAME, { path: '/' })
		}
	}

	if (pb.authStore.isValid) {
		context.locals.user = pb.authStore.record
	}

	context.locals.pb = pb

	const pathname = context.url.pathname
	const isApiRoute = pathname.startsWith('/api/')

	if (isApiRoute && !context.locals.user && !AUTH_WHITELISTED_API.has(pathname)) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	if (!context.locals.user && shouldProtectPath(pathname)) {
		return Response.redirect(new URL('/login', context.url), 303)
	}

	return next()
}
