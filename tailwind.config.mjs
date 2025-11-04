/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				'tavue-off-white': '#FAF9F6',
				'tavue-anthracite': '#1C1C1C',
				'tavue-beige': '#E9E4DA',
				'tavue-gold': '#D1B17A',
				'tavue-slate': '#5A6A73'
			},
			fontFamily: {
				playfair: ['"Playfair Display"', 'serif'],
				inter: ['Inter', 'sans-serif']
			},
			boxShadow: {
				gilded: '0 20px 60px rgba(209, 177, 122, 0.18)'
			},
			transitionTimingFunction: {
				elegant: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)'
			},
			borderRadius: {
				'2xl': '1.5rem',
				'3xl': '2rem'
			}
		}
	},
	plugins: []
};
