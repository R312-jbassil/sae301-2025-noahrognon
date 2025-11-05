import PocketBase from 'pocketbase';

export const resolvePocketBaseUrl = () => {
	// Si PUBLIC_PB_URL est définie, on la prend en priorité
	if (import.meta.env.PUBLIC_PB_URL) {
		return import.meta.env.PUBLIC_PB_URL;
	}

	// En développement → PocketBase local
	if (import.meta.env.MODE === 'development') {
		return 'http://localhost:8090';
	}

	// En production → PocketBase VPS
	return 'https://tavue.noahrognon.fr:443';
};

export const createPocketBase = () => {
	const baseUrl = resolvePocketBaseUrl();
	return new PocketBase(baseUrl);
};

const pb = createPocketBase();
export default pb;
