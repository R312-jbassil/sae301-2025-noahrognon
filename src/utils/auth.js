import PocketBase from 'pocketbase'
import baseClient from './pb.js'

const SECURE_COOKIE = import.meta.env.MODE !== 'development'

export const AUTH_COOKIE_NAME = 'pb_auth'
export const OAUTH_COOKIE_NAME = 'pb_oauth_state'

const createClient = () => new PocketBase(baseClient.baseUrl)

export const exportAuthCookie = (pb) =>
	pb
		? pb.authStore.exportToCookie({
				name: AUTH_COOKIE_NAME,
				httpOnly: true,
				secure: SECURE_COOKIE,
				sameSite: 'lax',
				path: '/'
		  })
		: ''

export const clearAuthCookie = () =>
	${AUTH_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; HttpOnly

export const exportOAuthStateCookie = (value) => {
	const encoded = encodeURIComponent(JSON.stringify(value))
	return ${OAUTH_COOKIE_NAME}=; Path=/; SameSite=Lax; HttpOnly; Max-Age=
}

export const clearOAuthStateCookie = () =>
	${OAUTH_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; HttpOnly

export const handleAuthFromCookies = async (request) => {
	const pb = createClient()
	const cookie = request.headers.get('cookie') ?? ''
	pb.authStore.loadFromCookie(cookie, AUTH_COOKIE_NAME)

	let authCookie = null

	try {
		if (pb.authStore.isValid) {
			await pb.collection('users').authRefresh()
			authCookie = exportAuthCookie(pb)
		}
	} catch {
		pb.authStore.clear()
		authCookie = clearAuthCookie()
	}

	return { pb, authCookie }
}

