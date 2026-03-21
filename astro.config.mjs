// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import netlify from '@astrojs/netlify';

const getAdapter = () => {
  if (process.env.NETLIFY) return netlify();
  return vercel();
};

export default defineConfig({
  output: 'server',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  },
  adapter: getAdapter()
});
