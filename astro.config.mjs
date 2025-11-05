import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server', // ou 'hybrid' selon tes besoins
  adapter: node({ mode: 'standalone' }), // ou { mode: 'server' }

  vite: {
    plugins: [tailwindcss()]
  }
});
