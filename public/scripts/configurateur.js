// public/scripts/configurateur.js
const state = {
	materialFrame: 'metal',
	materialTemples: 'metal',
	bridge: 5,
	lensSize: 5,
	lensColor: 'transparent',
	finish: 'brillant',
	engraveText: '',
	engraveSide: 'gauche',
	price: 250
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

const $ = (sel) => document.querySelector(sel);
let svgRoot;
let gMonture;
let gBrancheG;
let gBrancheD;
let gPont;
let gVerreG;
let gVerreD;
let txtGravure;

const getBaseTransform = (node) => node?.dataset.baseTransform || '';

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
	const base = getBaseTransform(gPont);
	const scale = 0.85 + ((mm - 2) / 8) * 0.4;
	const centerX = 298;
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
	$('#materialFrame').addEventListener('change', (e) => {
		state.materialFrame = e.target.value;
		applyAll();
	});
	$('#materialTemples').addEventListener('change', (e) => {
		state.materialTemples = e.target.value;
		applyAll();
	});
	$('#bridge').addEventListener('input', (e) => {
		state.bridge = Number(e.target.value);
		applyAll();
	});
	$('#lensSize').addEventListener('input', (e) => {
		state.lensSize = Number(e.target.value);
		applyAll();
	});
	$('#lensColor').addEventListener('change', (e) => {
		state.lensColor = e.target.value;
		applyAll();
	});
	document.querySelectorAll('.finish-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			state.finish = btn.dataset.finish;
			document.querySelectorAll('.finish-btn').forEach((b) =>
				b.classList.remove('ring-2', 'ring-amber-500', 'bg-amber-500/20')
			);
			btn.classList.add('ring-2', 'ring-amber-500', 'bg-amber-500/20');
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
}

function currentSVGString() {
	return svgRoot?.outerHTML ?? '';
}

async function saveComposition() {
	await persist('/api/save-composition');
}

async function createOrder() {
	await persist('/api/create-order');
}

async function persist(url) {
	try {
		const payload = { options: { ...state }, svg: currentSVGString() };
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await response.json();
		if (!response.ok || !data.ok) {
			throw new Error(data.error || 'Une erreur est survenue');
		}
		alert(url.includes('order') ? 'Commande creee.' : 'Configuration sauvegardee.');
	} catch (error) {
		console.error(error);
		alert(error.message || 'Impossible de traiter la requete.');
	}
}

bindUI();
loadSVG();
