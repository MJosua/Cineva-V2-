# Build demo Cineva satu file HTML

Demo lengkap Cineva (HQ + Creator) dengan data dummy di localStorage, tanpa backend, untuk dikirim ke client.

```bash
cd 1.Frontend/HOTS
CINEVA_DEMO_OUT=../../3.Knowledge/scripts/cineva_demo/out npx vite build -c vite.demo.config.ts
node ../../3.Knowledge/scripts/cineva_demo/inline-demo.mjs ../../3.Knowledge/scripts/cineva_demo/out ../../3.Knowledge/handover/cineva_full_demo_<tanggal>.html
```

- Entry: `cineva-preview.html` / `src/cineva-preview.tsx` (HashRouter, dummy repository). `vite.demo.config.ts` memakai `base: './'` dan satu bundle; skrip ini menyisipkan JS/CSS ke dalam HTML.
- Folder `out` adalah hasil build sementara; hapus setelah dipakai, jangan di-commit.
- Hasil terakhir: `3.Knowledge/handover/cineva_full_demo_2026_11_02.html` (1,4 MB), diuji lewat server lokal: dashboard HQ dan estimator tampil, tanpa error console.
