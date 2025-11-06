// public/scripts/configurateur.js
const state = {
	materialFrame: 'metal',
	materialFrameId: null,
	materialFrameLabel: 'Metal',
	materialTemples: 'metal',
	materialTemplesId: null,
	materialTemplesLabel: 'Metal',
	bridge: 5,
	lensSize: 5,
	lensColor: 'transparent',
	finish: 'brillant',
	engraveText: '',
	engraveSide: 'gauche',
	price: 250,
	editId: null
};

const MATERIAL_COLORS = {
	metal: '#C9C9C9',
	acetate: '#F0D6CF',
	bois: '#8B6B4A',
	titane: '#B7C1C8',
	or18k: '#D4AF37',
	orrose: '#E4B7A0'
};

const LENS_STYLES = {
	transparent: { fill: '#D9D9D9', opacity: 0.2 },
	gris: { fill: '#212121', opacity: 0.35 },
	brun: { fill: '#5A4332', opacity: 0.32 },
	bleu: { fill: '#3866A6', opacity: 0.35 },
	vert: { fill: '#4B775C', opacity: 0.35 },
	rose: { fill: '#C08A90', opacity: 0.32 }
};

const PRICING = {
	base: 250,
	material: { acetate: 20, bois: 35, titane: 60, or18k: 280, orrose: 120, metal: 0 },
	lensColor: { transparent: 0, gris: 15, brun: 15, bleu: 25, vert: 25, rose: 20 },
	finish: { brillant: 0, mat: 10, satine: 15 },
	engraving: 45
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const AI_STORAGE_KEY = 'tavue.aiPreset';

const $ = (sel) => document.querySelector(sel);
const materialIdByCode = {};
const materialCodeById = {};
let svgRoot;
let gMonture;
let gBrancheG;
let gBrancheD;
let gPont;
let gVerreG;
let gVerreD;
let txtGravure;
let aiSummaryEl;
let aiButton;
let bridgeValueEl;
let lensSizeValueEl;

const getBaseTransform = (node) => node?.dataset.baseTransform || '';

const slugify = (value) =>
	value
		.toString()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

async function loadMaterials() {
	try {
		const response = await fetch('/besoin/materiaux');
		if (!response.ok) throw new Error('materiaux-fetch-failed');
		const payload = await response.json();
		const items = Array.isArray(payload?.items) ? payload.items : [];
		items.forEach((item) => {
			const code = slugify(item.libelle ?? item.id);
			materialIdByCode[code] = item.id;
			materialCodeById[item.id] = code;
		});
	} catch (error) {
		console.warn('Materiaux fetch fallback', error);
	}
	applyMaterialIdsToOptions();
	syncMaterialStateFromSelects();
}

function applyMaterialIdsToOptions() {
	const frameSelect = $('#materialFrame');
	const templeSelect = $('#materialTemples');
	[frameSelect, templeSelect].forEach((select) => {
		if (!select) return;
		Array.from(select.options).forEach((option) => {
			const code = option.value;
			if (materialIdByCode[code]) {
				option.dataset.materialId = materialIdByCode[code];
			}
		});
	});
}

function syncMaterialStateFromSelects() {
	const frameSelect = $('#materialFrame');
	const frameOption = frameSelect?.selectedOptions?.[0];
	if (frameOption) {
		state.materialFrame = frameOption.value;
		state.materialFrameId =
			frameOption.dataset.materialId || materialIdByCode[frameOption.value] || null;
		state.materialFrameLabel = frameOption.textContent?.trim() || state.materialFrame;
	}
	const templeSelect = $('#materialTemples');
	const templeOption = templeSelect?.selectedOptions?.[0];
	if (templeOption) {
		state.materialTemples = templeOption.value;
		state.materialTemplesId =
			templeOption.dataset.materialId || materialIdByCode[templeOption.value] || null;
		state.materialTemplesLabel = templeOption.textContent?.trim() || state.materialTemples;
	}
}

function updateFinishButtons() {
	document.querySelectorAll('.finish-btn').forEach((btn) => {
		if (btn.dataset.finish === state.finish) {
			btn.classList.add('border-amber-500', 'shadow-[0_12px_30px_rgba(209,177,122,0.25)]');
			btn.classList.remove('border-neutral-700');
		} else {
			btn.classList.remove('border-amber-500', 'shadow-[0_12px_30px_rgba(209,177,122,0.25)]');
			btn.classList.add('border-neutral-700');
		}
	});
}

function setSelectValue(select, slug, materialId) {
	if (!select) return;
	let applied = false;
	if (slug && select.querySelector(`option[value="${slug}"]`)) {
		select.value = slug;
		applied = true;
	}
	if (!applied && materialId) {
		const match = Array.from(select.options).find(
			(option) => option.dataset.materialId === materialId
		);
		if (match) {
			select.value = match.value;
		}
	}
}

function syncEditQueryParam() {
	if (!window.history?.replaceState) return;
	const url = new URL(window.location.href);
	if (state.editId) {
		url.searchParams.set('edit', state.editId);
	} else {
		url.searchParams.delete('edit');
	}
	window.history.replaceState({}, '', url.toString());
}

async function loadSVG() {
	const res = await fetch('/assets/lunettes.svg');
	const raw = await res.text();
	$('#svgHost').innerHTML = raw;
	svgRoot = $('#svgHost svg');
	gMonture = svgRoot?.querySelector('#monture');
	gBrancheG = svgRoot?.querySelector('#branche-gauche');
	gBrancheD = svgRoot?.querySelector('#branche-droite');
	gPont = svgRoot?.querySelector('#pont');
	gVerreG = svgRoot?.querySelector('#verre-gauche');
	gVerreD = svgRoot?.querySelector('#verre-droit');
	txtGravure = svgRoot?.querySelector('#gravure');

	[gPont, gVerreG, gVerreD].forEach((node) => {
		if (node) {
			node.dataset.baseTransform = node.getAttribute('transform') || '';
		}
	});

	positionGravure();
	applyAll();
}

function applyAll() {
	const frame = MATERIAL_COLORS[state.materialFrame] || '#C9C9C9';
	const temples = MATERIAL_COLORS[state.materialTemples] || '#C9C9C9';

	colorize(gMonture, frame);
	colorize(gPont, frame);
	colorize(gBrancheG, temples);
	colorize(gBrancheD, temples);

	const lens = LENS_STYLES[state.lensColor];
	if (lens) {
		colorize(gVerreG, lens.fill, lens.opacity);
		colorize(gVerreD, lens.fill, lens.opacity);
	}

	applyFinish(state.finish);
	applyBridgeWidth(state.bridge);
	applyLensSize(state.lensSize);

	if (txtGravure) {
		txtGravure.textContent = state.engraveText || '';
		txtGravure.setAttribute('opacity', state.engraveText ? '1' : '0');
		positionGravure();
	}

	updatePrice();
	updateProgress();
	updateFinishButtons();
	if (bridgeValueEl) bridgeValueEl.textContent = state.bridge;
	if (lensSizeValueEl) lensSizeValueEl.textContent = state.lensSize;
}

function colorize(group, fill, opacity = 1) {
	if (!group) return;
	group.querySelectorAll('path, ellipse, polygon, rect').forEach((el) => {
		el.setAttribute('fill', fill);
		if (opacity !== 1) el.setAttribute('opacity', opacity);
		else el.removeAttribute('opacity');
	});
}

function applyFinish(kind) {
	const targets = [gMonture, gPont, gBrancheG, gBrancheD];
	targets.forEach((group) => {
		if (!group) return;
		group.style.filter = '';
		if (kind === 'mat') group.style.filter = 'saturate(0.7) brightness(0.95)';
		if (kind === 'satine') group.style.filter = 'contrast(1.05) saturate(0.9)';
		if (kind === 'brillant') group.style.filter = 'contrast(1.15) brightness(1.05)';
	});
}

function applyBridgeWidth(mm) {
	if (!gPont) return;
	if (!gPont.dataset.centerX) {
		const box = gPont.getBBox();
		gPont.dataset.centerX = String(box.x + box.width / 2);
	}
	const centerX = Number(gPont.dataset.centerX || 298);
	const base = getBaseTransform(gPont);
	const scale = 0.85 + ((mm - 2) / 8) * 0.4;
	gPont.setAttribute(
		'transform',
		`translate(${centerX} 0) scale(${scale},1) translate(${-centerX} 0) ${base}`.trim()
	);
}

function applyLensSize(val) {
	if (!gVerreG || !gVerreD) return;
	const scale = 0.9 + ((val - 1) / 9) * 0.3;
	const cxLeft = 190;
	const cyLeft = 215;
	const cxRight = 320;
	const cyRight = 220;
	gVerreG.setAttribute(
		'transform',
		`translate(${cxLeft} ${cyLeft}) scale(${scale}) translate(${-cxLeft} ${-cyLeft}) ${getBaseTransform(gVerreG)}`.trim()
	);
	gVerreD.setAttribute(
		'transform',
		`translate(${cxRight} ${cyRight}) scale(${scale}) translate(${-cxRight} ${-cyRight}) ${getBaseTransform(gVerreD)}`.trim()
	);
}

function positionGravure() {
	if (!txtGravure) return;
	txtGravure.setAttribute('font-size', '10');
	txtGravure.setAttribute('fill', '#111');
	if (state.engraveSide === 'gauche') {
		txtGravure.setAttribute('x', '130');
		txtGravure.setAttribute('y', '180');
		txtGravure.setAttribute('transform', '');
	} else {
		txtGravure.setAttribute('x', '430');
		txtGravure.setAttribute('y', '195');
		txtGravure.setAttribute('transform', '');
	}
}

function updatePrice() {
	let price = PRICING.base;
	price += PRICING.material[state.materialFrame] || 0;
	price += PRICING.material[state.materialTemples] || 0;
	price += PRICING.lensColor[state.lensColor] || 0;
	price += PRICING.finish[state.finish] || 0;
	if (state.engraveText) price += PRICING.engraving;
	state.price = price;
	$('#price').textContent = price;
	$('#priceBig').textContent = price;
}

function updateProgress() {
	let done = 0;
	if (state.materialFrame) done++;
	if (state.materialTemples) done++;
	if (state.lensColor) done++;
	if (state.finish) done++;
	if (state.bridge !== 5) done++;
	if (state.lensSize !== 5) done++;
	if (state.engraveText) done++;
	const pct = Math.min(100, Math.round((done / 7) * 100));
	$('#progress').textContent = `${pct}%`;
}

function bindUI() {
	aiSummaryEl = $('#aiSummary');
	aiButton = $('#btnInspire');
	bridgeValueEl = $('#bridgeValue');
	lensSizeValueEl = $('#lensSizeValue');
	$('#materialFrame').addEventListener('change', (e) => {
		const option = e.target.selectedOptions?.[0];
		state.materialFrame = option?.value ?? state.materialFrame;
		state.materialFrameId =
			option?.dataset.materialId || materialIdByCode[state.materialFrame] || null;
		state.materialFrameLabel = option?.textContent?.trim() || state.materialFrame;
		applyAll();
	});
	$('#materialTemples').addEventListener('change', (e) => {
		const option = e.target.selectedOptions?.[0];
		state.materialTemples = option?.value ?? state.materialTemples;
		state.materialTemplesId =
			option?.dataset.materialId || materialIdByCode[state.materialTemples] || null;
		state.materialTemplesLabel = option?.textContent?.trim() || state.materialTemples;
		applyAll();
	});
	$('#bridge').addEventListener('input', (e) => {
		state.bridge = Number(e.target.value);
		if (bridgeValueEl) bridgeValueEl.textContent = state.bridge;
		applyAll();
	});
	$('#lensSize').addEventListener('input', (e) => {
		state.lensSize = Number(e.target.value);
		if (lensSizeValueEl) lensSizeValueEl.textContent = state.lensSize;
		applyAll();
	});
	$('#lensColor').addEventListener('change', (e) => {
		state.lensColor = e.target.value;
		applyAll();
	});
	document.querySelectorAll('.finish-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			state.finish = btn.dataset.finish;
			updateFinishButtons();
			applyAll();
		});
	});
	$('#engraveText').addEventListener('input', (e) => {
		state.engraveText = e.target.value.trim();
		applyAll();
	});
	document.querySelectorAll("input[name='engraveSide']").forEach((radio) => {
		radio.addEventListener('change', (e) => {
			state.engraveSide = e.target.value;
			applyAll();
		});
	});

	$('#btnSave').addEventListener('click', saveComposition);
	$('#btnOrder').addEventListener('click', createOrder);
	if (aiButton) {
		aiButton.addEventListener('click', async () => {
			const idea = prompt('Décrivez vos lunettes idéales (style, usage, ambiance...) :');
			if (!idea) return;
			await requestAIInspiration(idea);
		});
	}
}

function currentSVGString() {
	return svgRoot?.outerHTML ?? '';
}

async function saveComposition() {
	await persist('/besoin/save-composition');
}

async function createOrder() {
	await persist('/besoin/create-order');
}

async function persist(url) {
	try {
		const payloadOptions = { ...state };
		delete payloadOptions.editId;
		const payload = {
			options: payloadOptions,
			svg: currentSVGString(),
			editId: state.editId
		};
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await response.json();
		if (!response.ok || !data.ok) {
			throw new Error(data.error || 'Une erreur est survenue');
		}
		if (data?.id) {
			state.editId = data.id;
		} else if (data?.lunetteId) {
			state.editId = data.lunetteId;
		}
		if (state.editId) {
			syncEditQueryParam();
		}
		alert(url.includes('order') ? 'Commande creee.' : 'Configuration sauvegardee.');
	} catch (error) {
		console.error(error);
		alert(error.message || 'Impossible de traiter la requete.');
	}
}

function applyOptionsPayload(options = {}, controls = {}) {
	if (controls.resetEditId) {
		state.editId = null;
	}
	if (Object.prototype.hasOwnProperty.call(controls, 'setEditId')) {
		state.editId = controls.setEditId;
	}

	const frameSelect = $('#materialFrame');
	const templeSelect = $('#materialTemples');

	if (options.materialFrame || options.materialFrameId) {
		setSelectValue(frameSelect, options.materialFrame, options.materialFrameId);
	}
	if (options.materialTemples || options.materialTemplesId) {
		setSelectValue(templeSelect, options.materialTemples, options.materialTemplesId);
	}

	syncMaterialStateFromSelects();

	if (options.materialFrameLabel) state.materialFrameLabel = options.materialFrameLabel;
	if (options.materialFrameId) state.materialFrameId = options.materialFrameId;
	if (options.materialTemplesLabel) state.materialTemplesLabel = options.materialTemplesLabel;
	if (options.materialTemplesId) state.materialTemplesId = options.materialTemplesId;

	if (typeof options.bridge !== 'undefined') {
		state.bridge = clamp(Number(options.bridge) || 5, 2, 10);
		const bridgeInput = $('#bridge');
		if (bridgeInput) bridgeInput.value = state.bridge;
	}

	if (typeof options.lensSize !== 'undefined') {
		state.lensSize = clamp(Number(options.lensSize) || 5, 1, 10);
		const lensSizeInput = $('#lensSize');
		if (lensSizeInput) lensSizeInput.value = state.lensSize;
	}

	if (options.lensColor) {
		const lensColorSelect = $('#lensColor');
		if (lensColorSelect && lensColorSelect.querySelector(`option[value="${options.lensColor}"]`)) {
			lensColorSelect.value = options.lensColor;
			state.lensColor = options.lensColor;
		}
	}

	if (options.finish) {
		state.finish = options.finish;
	}

	if (typeof options.engraveText !== 'undefined') {
		const text = (options.engraveText ?? '').toString();
		state.engraveText = text.slice(0, 20);
		const engraveInput = $('#engraveText');
		if (engraveInput) engraveInput.value = state.engraveText;
	}

	if (options.engraveSide) {
		state.engraveSide = options.engraveSide;
		const engraveRadio = document.querySelector(
			`input[name='engraveSide'][value='${state.engraveSide}']`
		);
		if (engraveRadio) engraveRadio.checked = true;
	}

	if (typeof options.price === 'number') {
		state.price = options.price;
	}

	updateFinishButtons();
	applyAll();
	syncEditQueryParam();
}

function displaySummary(message) {
	if (!aiSummaryEl) return;
	if (message) {
		aiSummaryEl.textContent = message;
		aiSummaryEl.classList.remove('hidden');
	} else {
		aiSummaryEl.textContent = '';
		aiSummaryEl.classList.add('hidden');
	}
}

function hydrateFromAIStorage() {
	try {
		const stored = localStorage.getItem(AI_STORAGE_KEY);
		if (!stored) return false;
		const parsed = JSON.parse(stored);
		if (!parsed?.options) {
			localStorage.removeItem(AI_STORAGE_KEY);
			return false;
		}
		applyOptionsPayload(parsed.options, { resetEditId: true });
		displaySummary(parsed.summary || 'Suggestion importée depuis la page Inspiration IA.');
		localStorage.removeItem(AI_STORAGE_KEY);
		return true;
	} catch (error) {
		console.warn('Failed to hydrate AI preset', error);
		localStorage.removeItem(AI_STORAGE_KEY);
		return false;
	}
}

function setAiLoading(isLoading) {
	if (!aiButton) return;
	aiButton.disabled = isLoading;
	aiButton.classList.toggle('opacity-50', isLoading);
	aiButton.classList.toggle('cursor-not-allowed', isLoading);
	aiButton.setAttribute('aria-busy', isLoading ? 'true' : 'false');
}

async function requestAIInspiration(promptText) {
	if (!promptText?.trim()) return;
	displaySummary('Génération en cours…');
	localStorage.removeItem(AI_STORAGE_KEY);
	setAiLoading(true);
	try {
		const response = await fetch('/v2/ai-lunettes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prompt: promptText })
		});
		const payload = await response.json().catch(() => null);

		if (response.status === 401) {
			window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
			return;
		}

		if (!response.ok || !payload?.ok) {
			const code = payload?.error || 'ai-generation-failed';
			throw new Error(
				code === 'openai-missing-key'
					? "La fonctionnalité IA n'est pas disponible pour le moment."
					: 'Impossible de générer automatiquement une configuration.'
			);
		}

		applyOptionsPayload(payload.options || {}, { resetEditId: true });
		displaySummary(payload.summary || 'Inspiration générée automatiquement par IA.');
	} catch (error) {
		console.error('AI generation failed', error);
		displaySummary('');
		alert(error?.message || 'La génération IA a échoué.');
	} finally {
		setAiLoading(false);
	}
}

async function loadExistingConfiguration(id) {
	try {
		const response = await fetch(`/besoin/lunettes/${id}`);
		if (!response.ok) {
			throw new Error('lunette-fetch-failed');
		}
		const payload = await response.json();
		if (!payload?.ok) {
			throw new Error(payload?.error || 'lunette-fetch-failed');
		}
		const { options } = payload;
		applyOptionsPayload(
			{
				...options,
				materialFrame:
					options.materialFrameSlug ??
					options.materialFrame ??
					(state.materialFrameId ? materialCodeById[state.materialFrameId] : null),
				materialTemples:
					options.materialTemplesSlug ??
					options.materialTemples ??
					(state.materialTemplesId ? materialCodeById[state.materialTemplesId] : null)
			},
			{ setEditId: id }
		);
		displaySummary('');
	} catch (error) {
		console.error('loadExistingConfiguration error', error);
	}
}

async function init() {
	await loadMaterials();
	bindUI();
	displaySummary('');
	syncMaterialStateFromSelects();
	await loadSVG();
	const hydrated = hydrateFromAIStorage();
	const params = new URLSearchParams(window.location.search);
	const editParam = params.get('edit');
	if (editParam && !hydrated) {
		state.editId = editParam;
		await loadExistingConfiguration(editParam);
	}
}

init();
