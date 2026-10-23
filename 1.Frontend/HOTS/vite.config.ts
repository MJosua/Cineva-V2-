import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/hots/",
  build: {
    rollupOptions: {
      input: { main: path.resolve(__dirname, 'index.html'), cinevaPreview: path.resolve(__dirname, 'cineva-preview.html') },
    },
  },
  // Local preview only: fixed read-only Excel bridge; never targets the app database.
  preview: {
    proxy: { '/hots/reference-excel': { target: 'http://127.0.0.1:48176', changeOrigin: true, rewrite: p => p.replace('/hots/reference-excel', '') } },
  },
  server: {
    proxy: { '/hots/reference-excel': { target: 'http://127.0.0.1:48176', changeOrigin: true, rewrite: p => p.replace('/hots/reference-excel', '') } },
    host: "::",
    port: 8080,
    fs: { allow: [path.resolve(__dirname, '..')] },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Optional package peers resolve from this host, even when npm keeps them under HOTS/node_modules.
    dedupe: ["react", "react-dom", "react-router-dom", "axios", "framer-motion", "next-themes", "react-hook-form", "recharts", "react-pdf", "xlsx", "@tiptap/react", "@tiptap/starter-kit", "@tiptap/extension-image", "@tiptap/extension-link"],
  },
}));
