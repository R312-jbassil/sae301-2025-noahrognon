import { createPocketBaseClient } from '../utils/pb.js'

const AUTH_COOKIE_NAME = 'pb_auth'
const AUTH_WHITELISTED_API = new Set(['/connexion/login', '/connexion/signup'])
const PROTECTED_PATH_PREFIXES = ['/mon-compte', '/mes-creations', '/besoin']

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
	const isConnexionRoute = pathname.startsWith('/connexion/')

	if (isConnexionRoute && !context.locals.user && !AUTH_WHITELISTED_API.has(pathname)) {
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
