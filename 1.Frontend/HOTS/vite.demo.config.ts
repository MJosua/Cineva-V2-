// Demo build: Cineva preview (dummy + localStorage) as one self-contained HTML for client demos. Output is generated, not source.
import { defineConfig, mergeConfig, type UserConfig } from 'vite';
import path from 'path';
import base from './vite.config';
export default defineConfig(env => {
  const config = mergeConfig((base as (e: typeof env) => UserConfig)(env), {
    base: './', publicDir: false,
    build: { outDir: process.env.CINEVA_DEMO_OUT ?? 'dist-cineva-demo', emptyOutDir: true, assetsInlineLimit: 100_000_000, cssCodeSplit: false },
  }) as UserConfig;
  config.build!.rollupOptions = { input: path.resolve(__dirname, 'cineva-preview.html'), output: { inlineDynamicImports: true } };
  return config;
});
