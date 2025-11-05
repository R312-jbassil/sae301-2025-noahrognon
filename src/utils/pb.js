import PocketBase from 'pocketbase'

let path = ''

if (import.meta.env.MODE === 'development') {
    path = 'http://localhost:8090' // en local
} else {
    path = 'https://lunette.noahrognon.fr:443' // sur ton VPS
}

const pb = new PocketBase(path)
export default pb

