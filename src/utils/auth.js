import PocketBase from "pocketbase"
import { PB_BASE_URL } from "./pb.js"

const SECURE_COOKIE = import.meta.env.MODE !== "development"

export const AUTH_COOKIE_NAME = "pb_auth"
export const OAUTH_COOKIE_NAME = "pb_oauth_state"

// Use SameSite=None in production when cookies are Secure so cross-site requests
// (or proxied deployments) won't block the cookie. Use Lax for development.
const SAME_SITE = SECURE_COOKIE ? "None" : "Lax"

const createClient = () => new PocketBase(PB_BASE_URL)

export const exportAuthCookie = (client) =>
		client
				? client.authStore.exportToCookie({
							 name: AUTH_COOKIE_NAME,
							 httpOnly: true,
							 secure: SECURE_COOKIE,
							 // pocketbase expects a string like 'none'|'lax'|'strict' (case-insensitive)
							 sameSite: SAME_SITE.toLowerCase(),
							 path: "/"
					})
				: ""

export const clearAuthCookie = () =>
	`${AUTH_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=${SAME_SITE}; ${
		SECURE_COOKIE ? "Secure; " : ""
	}HttpOnly;`

export const exportOAuthStateCookie = (value) => {
	const encoded = encodeURIComponent(JSON.stringify(value))
	return `${OAUTH_COOKIE_NAME}=${encoded}; Path=/; SameSite=${SAME_SITE}; ${
		SECURE_COOKIE ? "Secure; " : ""
	}HttpOnly; Max-Age=${60 * 10}`
}

export const clearOAuthStateCookie = () =>
	`${OAUTH_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=${SAME_SITE}; ${
		SECURE_COOKIE ? "Secure; " : ""
	}HttpOnly;`

// Helper to normalize a cookie string that might contain multiple lines and
// return an array of cookie header values. Some libraries return multi-line
// cookie strings; when adding headers we should append each cookie separately.
export const splitCookieHeader = (cookieString) => {
	if (!cookieString) return []
	return cookieString
		.split(/\r?\n/) // split multiple lines
		.map((s) => s.trim())
		.filter(Boolean)
}

export const handleAuthFromCookies = async (request) => {
	const client = createClient()
	const cookie = request.headers.get("cookie") ?? ""
	client.authStore.loadFromCookie(cookie, AUTH_COOKIE_NAME)

	let authCookie = null

	try {
		if (client.authStore.isValid) {
			await client.collection("users").authRefresh()
			authCookie = exportAuthCookie(client)
		}
	} catch (error) {
		console.error("Auth refresh failed:", error)
		client.authStore.clear()
		authCookie = clearAuthCookie()
	}

	return { pb: client, authCookie }
}
