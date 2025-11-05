import PocketBase from 'pocketbase';

const DEFAULT_DEV_URL = 'http://127.0.0.1:8090';
// En prod, utiliser le même domaine que ton site (Apache reverse proxy /api et /_/)
const DEFAULT_PROD_URL = 'https://lunette.noahrognon.fr:443';

export const resolvePocketBaseUrl = () => {
	if (import.meta.env.PUBLIC_PB_URL) {
		return import.meta.env.PUBLIC_PB_URL;
	}
	if (import.meta.env.MODE === 'development') {
		return DEFAULT_DEV_URL;
	}
	return DEFAULT_PROD_URL;
};

export const createPocketBase = () => {
	const baseUrl = resolvePocketBaseUrl();
	return new PocketBase(baseUrl);
};

const pb = createPocketBase();
export default pb;
