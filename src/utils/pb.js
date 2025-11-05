import PocketBase from 'pocketbase'

const normalizeUrl = (value) => {
	if (typeof value !== 'string') return null
	const trimmed = value.trim()
	if (!trimmed) return null
	return trimmed.replace(/\/+$/, '')
}

const envUrl =
	normalizeUrl(import.meta.env?.PUBLIC_PB_URL) ??
	normalizeUrl(import.meta.env?.PB_BASE_URL) ??
	normalizeUrl(process.env?.PUBLIC_PB_URL) ??
	normalizeUrl(process.env?.PB_BASE_URL)

const DEFAULT_DEV_URL = 'http://127.0.0.1:8090'
const DEFAULT_PROD_URL = 'https://lunette.noahrognon.fr'

const resolvedUrl =
	envUrl ??
	(import.meta.env?.MODE === 'development' ? DEFAULT_DEV_URL : DEFAULT_PROD_URL)

export const PB_BASE_URL = resolvedUrl

export const createPocketBaseClient = () => new PocketBase(PB_BASE_URL)

export default createPocketBaseClient()

