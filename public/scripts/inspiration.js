const form = document.querySelector('#ai-form');
const promptInput = document.querySelector('#aiPrompt');
const submitButton = document.querySelector('#aiSubmit');
const statusEl = document.querySelector('#aiStatus');
const resultsEl = document.querySelector('#aiResults');
const countEl = document.querySelector('#aiCount');

const STORAGE_KEY = 'tavue.aiPreset';

const formatListItem = (label, value) => {
	const container = document.createElement('li');
	container.className = 'flex items-start gap-2 text-sm text-[#C8CED8]';
	const dot = document.createElement('span');
	dot.className = 'mt-2 block h-1.5 w-1.5 rounded-full bg-[#D1B17A]';
	const content = document.createElement('span');
	content.innerHTML = `<strong class="text-[#F7F4ED]">${label} :</strong> ${value}`;
	container.append(dot, content);
	return container;
};

const setStatus = (message, tone = 'info') => {
	if (!statusEl) return;
	statusEl.textContent = message || '';
	statusEl.classList.remove('text-[#E98074]', 'text-[#7CC6B1]');
	if (!message) return;
	statusEl.classList.add(tone === 'error' ? 'text-[#E98074]' : 'text-[#7CC6B1]');
};

const setLoading = (isLoading) => {
	if (!submitButton) return;
	submitButton.disabled = isLoading;
	submitButton.classList.toggle('opacity-60', isLoading);
	submitButton.classList.toggle('cursor-not-allowed', isLoading);
	submitButton.setAttribute('aria-busy', isLoading ? 'true' : 'false');
};

const updateCount = (count) => {
	if (!countEl) return;
	const value = Number(count) || 0;
	countEl.textContent = value === 0 ? '0 résultat' : `${value} résultat${value > 1 ? 's' : ''}`;
};

const renderResultCard = (payload) => {
	resultsEl.replaceChildren();

	const { options, summary } = payload;
	const card = document.createElement('div');
	card.className =
		'flex flex-col gap-4 rounded-2xl border border-[#252931] bg-[#171A1F] p-5 shadow-[0_14px_35px_-18px_rgba(0,0,0,0.55)]';

	const header = document.createElement('div');
	header.className = 'space-y-2';
	const title = document.createElement('h3');
	title.className = 'font-playfair text-xl text-white';
	title.textContent = 'Suggestion IA';
	const description = document.createElement('p');
	description.className = 'text-sm text-[#A4AAB4]';
	description.textContent = summary || "Une proposition inspirée de votre description.";
	header.append(title, description);

	const list = document.createElement('ul');
	list.className = 'space-y-3 rounded-2xl border border-[#23262C] bg-[#121417] p-4';
	list.append(
		formatListItem('Monture', `${options.materialFrameLabel} (${options.materialFrame})`),
		formatListItem('Branches', `${options.materialTemplesLabel} (${options.materialTemples})`),
		formatListItem('Couleur des verres', `${options.lensColorLabel} (${options.lensColor})`),
		formatListItem('Finition', `${options.finishLabel} (${options.finish})`),
		formatListItem('Largeur du pont', `${options.bridge} mm`),
		formatListItem('Taille des verres', `${options.lensSize} / 10`),
		formatListItem(
			'Gravure',
			options.engraveText ? `"${options.engraveText}" (${options.engraveSide})` : 'Aucune'
		),
		formatListItem('Prix estimé', `${options.price} €`)
	);

	const actionBar = document.createElement('div');
	actionBar.className = 'flex flex-wrap items-center gap-3';

	const applyButton = document.createElement('button');
	applyButton.type = 'button';
	applyButton.className =
		'inline-flex items-center gap-2 rounded-full bg-[#D1B17A] px-4 py-2 text-xs font-semibold text-[#2F2719] transition hover:bg-[#C7A068]';
	applyButton.innerHTML = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M4.167 10h11.666m0 0-3.333 3.333M15.833 10l-3.333-3.333"></path></svg> Ouvrir dans le configurateur`;
	applyButton.addEventListener('click', () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				options,
				summary,
				date: Date.now()
			})
		);
		window.location.href = '/configurateur';
	});

	const shareHint = document.createElement('p');
	shareHint.className = 'text-xs text-[#6C737D]';
	shareHint.textContent = 'Vous pourrez ajuster les détails et sauvegarder votre composition.';

	actionBar.append(applyButton, shareHint);
	card.append(header, list, actionBar);
	resultsEl.append(card);
	updateCount(1);
};

if (form && promptInput) {
	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		const prompt = promptInput.value.trim();
		if (!prompt) {
			setStatus('Décrivez votre idée pour lancer la génération.', 'error');
			return;
		}

		setStatus('Analyse de votre demande…', 'info');
		setLoading(true);

		try {
		const response = await fetch('/api/ai-lunettes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt })
			});

			const payload = await response.json().catch(() => null);

			if (response.status === 401) {
				window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
				return;
			}

			if (!response.ok || !payload?.ok) {
				const code = payload?.error || 'ai-generation-failed';
				throw new Error(
					code === 'missing-prompt'
						? 'La demande est incomplète.'
						: code === 'openai-missing-key'
						? 'Le service IA n’est pas disponible pour le moment.'
						: 'Impossible de générer une suggestion. Réessayez avec d’autres mots-clés.'
				);
			}

			renderResultCard(payload);
			setStatus('Suggestion prête !', 'success');
		} catch (error) {
			console.error('ai inspiration error', error);
			setStatus(error?.message || 'La génération a échoué. Réessayez.', 'error');
			resultsEl.innerHTML =
				'<div class="rounded-xl border border-[#2A2E36] bg-[#181B20] p-4 text-sm text-[#A4AAB4]">Impossible d’afficher une proposition pour le moment.</div>';
			updateCount(0);
		} finally {
			setLoading(false);
		}
	});
}
