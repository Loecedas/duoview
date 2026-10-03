// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import netlify from '@astrojs/netlify';
import cloudflare from '@astrojs/cloudflare';

function resolveAdapter() {
  // 本地开发 (dev) 阶段无需适配器，使用 Astro 原生开发服务器，彻底避免 Cloudflare runner-worker 冲突
  if (process.argv.includes('dev') || process.env.NODE_ENV === 'development') {
    return undefined;
  }
  if (process.env.NETLIFY) {
    return netlify();
  }
  if (process.env.VERCEL) {
    return vercel();
  }
  // 构建阶段 (build) 默认使用 Cloudflare 适配器
  return cloudflare();
}

export default defineConfig({
  output: 'server',
  adapter: resolveAdapter(),
  image: {
    service: passthroughImageService(),
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react-is', 'recharts'],
    },
  },
});
