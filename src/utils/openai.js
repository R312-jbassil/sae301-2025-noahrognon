import OpenAI from 'openai'

let clientInstance = null

const resolveApiKey = () =>
	import.meta.env?.OPENAI_API_KEY ?? process.env?.OPENAI_API_KEY ?? null

export const isOpenAIEnabled = () => Boolean(resolveApiKey())

export const getOpenAIClient = () => {
	const apiKey = resolveApiKey()
	if (!apiKey) {
		throw new Error('OPENAI_API_KEY manquant pour les fonctionnalités IA.')
	}
	if (!clientInstance) {
		clientInstance = new OpenAI({ apiKey })
	}
	return clientInstance
}

export const AVAILABLE_MATERIALS = [
	{ slug: 'metal', label: 'Métal' },
	{ slug: 'acetate', label: 'Acétate' },
	{ slug: 'bois', label: 'Bois' },
	{ slug: 'titane', label: 'Titane' },
	{ slug: 'or18k', label: 'Or 18K' },
	{ slug: 'orrose', label: 'Or rose' }
]

export const AVAILABLE_LENS_COLORS = [
	{ slug: 'transparent', label: 'Transparent' },
	{ slug: 'gris', label: 'Gris foncé' },
	{ slug: 'brun', label: 'Brun chaud' },
	{ slug: 'bleu', label: 'Bleu miroir' },
	{ slug: 'vert', label: 'Vert polarisé' },
	{ slug: 'rose', label: 'Rose teinté' }
]

export const AVAILABLE_FINISHES = [
	{ slug: 'brillant', label: 'Brillant' },
	{ slug: 'mat', label: 'Mat' },
	{ slug: 'satine', label: 'Satiné' }
]

export const AVAILABLE_ENGRAVE_SIDES = [
	{ slug: 'gauche', label: 'Branche gauche' },
	{ slug: 'droite', label: 'Branche droite' }
]

const materialMap = Object.fromEntries(AVAILABLE_MATERIALS.map((item) => [item.slug, item.label]))
const lensColorMap = Object.fromEntries(AVAILABLE_LENS_COLORS.map((item) => [item.slug, item.label]))
const finishMap = Object.fromEntries(AVAILABLE_FINISHES.map((item) => [item.slug, item.label]))

export const normaliseOptions = (raw = {}) => {
	const safeNumber = (value, min, max, fallback) => {
		const num = Number(value)
		if (Number.isFinite(num)) {
			return Math.min(max, Math.max(min, num))
		}
		return fallback
	}

	const materialFrame = materialMap[raw.materialFrame] ? raw.materialFrame : 'metal'
	const materialTemples = materialMap[raw.materialTemples] ? raw.materialTemples : materialFrame
	const lensColor = lensColorMap[raw.lensColor] ? raw.lensColor : 'transparent'
	const finish = finishMap[raw.finish] ? raw.finish : 'brillant'
	const engraveSide = AVAILABLE_ENGRAVE_SIDES.some((side) => side.slug === raw.engraveSide)
		? raw.engraveSide
		: 'gauche'

	const bridge = safeNumber(raw.bridge, 2, 10, 5)
	const lensSize = safeNumber(raw.lensSize, 1, 10, 5)

	const engraveText = (raw.engraveText ?? '').toString().slice(0, 20).trim()

	return {
		materialFrame,
		materialFrameLabel: materialMap[materialFrame],
		materialTemples,
		materialTemplesLabel: materialMap[materialTemples],
		lensColor,
		lensColorLabel: lensColorMap[lensColor],
		finish,
		finishLabel: finishMap[finish],
		bridge,
		lensSize,
		engraveText,
		engraveSide,
		price: calculatePrice({
			materialFrame,
			materialTemples,
			lensColor,
			finish,
			engraveText
		})
	}
}

const PRICING = {
	base: 250,
	material: { acetate: 20, bois: 35, titane: 60, or18k: 280, orrose: 120, metal: 0 },
	lensColor: { transparent: 0, gris: 15, brun: 15, bleu: 25, vert: 25, rose: 20 },
	finish: { brillant: 0, mat: 10, satine: 15 },
	engraving: 45
}

export const calculatePrice = (options) => {
	let price = PRICING.base
	price += PRICING.material[options.materialFrame] || 0
	price += PRICING.material[options.materialTemples] || 0
	price += PRICING.lensColor[options.lensColor] || 0
	price += PRICING.finish[options.finish] || 0
	if (options.engraveText) price += PRICING.engraving
	return price
}
