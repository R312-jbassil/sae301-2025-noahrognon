import PocketBase from 'pocketbase'

const path = import.meta.env.MODE === 'development'
    ? 'http://localhost:8090'
    : 'https://lunette.noahrognon.fr:443'

export const PB_BASE_URL = path

const pb = new PocketBase(path)

export default pb

