import PocketBase from "pocketbase"
import { PB_BASE_URL } from "./pb.js"

const SECURE_COOKIE = import.meta.env.MODE !== "development"

export const AUTH_COOKIE_NAME = "pb_auth"
export const OAUTH_COOKIE_NAME = "pb_oauth_state"

const createClient = () => new PocketBase(PB_BASE_URL)

export const exportAuthCookie = (client) =>
	client
		? client.authStore.exportToCookie({
				name: AUTH_COOKIE_NAME,
				httpOnly: true,
				secure: SECURE_COOKIE,
				sameSite: "lax",
				path: "/"
		  })
		: ""

export const clearAuthCookie = () =>
	`${AUTH_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; ${
		SECURE_COOKIE ? "Secure; " : ""
	}HttpOnly`

export const exportOAuthStateCookie = (value) => {
	const encoded = encodeURIComponent(JSON.stringify(value))
	return `${OAUTH_COOKIE_NAME}=${encoded}; Path=/; SameSite=Lax; ${
		SECURE_COOKIE ? "Secure; " : ""
	}HttpOnly; Max-Age=${60 * 10}`
}

export const clearOAuthStateCookie = () =>
	`${OAUTH_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; ${
		SECURE_COOKIE ? "Secure; " : ""
	}HttpOnly`

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
