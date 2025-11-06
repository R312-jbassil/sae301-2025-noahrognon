const THEME_KEY = 'tavue-theme'
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const html = document.documentElement

const applyTheme = (theme, icons) => {
	html.classList.remove('light', 'dark')
	html.classList.add(theme)
	html.dataset.theme = theme
	if (icons) {
		const { sun, moon } = icons
		if (sun) sun.classList.toggle('hidden', theme !== 'light')
		if (moon) moon.classList.toggle('hidden', theme === 'light')
	}
}

const currentTheme = () => localStorage.getItem(THEME_KEY) ?? (prefersDark ? 'dark' : 'light')

export const initTheme = () => {
	const toggle = document.querySelector('[data-theme-toggle]')
	if (!toggle) return
	const iconSun = document.querySelector('[data-theme-icon-sun]')
	const iconMoon = document.querySelector('[data-theme-icon-moon]')
	const icons = { sun: iconSun, moon: iconMoon }

	const theme = currentTheme()
	applyTheme(theme, icons)

	toggle.addEventListener('click', () => {
		const next = html.classList.contains('dark') ? 'light' : 'dark'
		applyTheme(next, icons)
		localStorage.setItem(THEME_KEY, next)
	})
}

initTheme()
