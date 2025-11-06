import { getOpenAIClient, isOpenAIEnabled, normaliseOptions } from '../../utils/openai.js'

export const prerender = false

const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans le design de lunettes personnalisées. 
Ton objectif est de transformer la requête de l'utilisateur en un jeu de paramètres compatibles avec le configurateur TaVue.

CONTRAINTES IMPORTANTES :
- Retourne uniquement les valeurs autorisées.
- "materialFrame" et "materialTemples" doivent être l'un de: metal, acetate, bois, titane, or18k, orrose.
- "lensColor" doit être: transparent, gris, brun, bleu, vert, rose.
- "finish" doit être: brillant, mat, satine.
- "engraveSide" doit être: gauche ou droite.
- "bridge" est un entier entre 2 et 10.
- "lensSize" est un entier entre 1 et 10.
- "engraveText" est une courte gravure (max 20 caractères) ou une chaîne vide s'il n'y a pas de gravure pertinente.

FOURNIS AUSSI une courte description marketing ("summary") qui justifie les choix.`

const JSON_SCHEMA = {
	name: 'lunettes_config',
	schema: {
		type: 'object',
		required: ['options', 'summary'],
		properties: {
			options: {
				type: 'object',
				required: [
					'materialFrame',
					'materialTemples',
					'lensColor',
					'finish',
					'bridge',
					'lensSize',
					'engraveText',
					'engraveSide'
				],
				properties: {
					materialFrame: { type: 'string' },
					materialTemples: { type: 'string' },
					lensColor: { type: 'string' },
					finish: { type: 'string' },
					bridge: { type: 'integer' },
					lensSize: { type: 'integer' },
					engraveText: { type: 'string' },
					engraveSide: { type: 'string' }
				},
				additionalProperties: false
			},
			summary: { type: 'string' }
		},
		additionalProperties: false
	}
}

const parseBody = async (request) => {
	try {
		const json = await request.json()
		return typeof json === 'object' && json !== null ? json : {}
	} catch {
		return {}
	}
}

export const POST = async ({ request, locals }) => {
	if (!locals?.user) {
		return new Response(JSON.stringify({ error: 'not-authenticated' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	if (!isOpenAIEnabled()) {
		return new Response(JSON.stringify({ error: 'openai-missing-key' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	const body = await parseBody(request)
	const prompt = body?.prompt?.toString().trim()

	if (!prompt) {
		return new Response(JSON.stringify({ error: 'missing-prompt' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	try {
		const client = getOpenAIClient()
		const response = await client.responses.create({
			model: 'gpt-4.1-mini',
			text: {
				format: {
					type: 'json_schema',
					name: JSON_SCHEMA.name,
					schema: JSON_SCHEMA.schema
				}
			},
			input: [
				{ role: 'system', content: SYSTEM_PROMPT },
				{
					role: 'user',
					content: `Consigne utilisateur: """${prompt}"""\nProduis les paramètres conformes.`
				}
			]
		})

		const rawText = response?.output_text ?? ''
		let parsed = null
		if (rawText) {
			try {
				parsed = JSON.parse(rawText)
			} catch (parseError) {
				console.warn('AI response parse error', parseError, rawText)
			}
		}
		const safeOptions = normaliseOptions(parsed?.options ?? {})

		return new Response(
			JSON.stringify({
				ok: true,
				options: safeOptions,
				summary: parsed?.summary ?? null
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			}
		)
	} catch (error) {
		console.error('AI generation error', error)
		return new Response(JSON.stringify({ error: 'ai-generation-failed' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}
