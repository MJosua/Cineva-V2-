
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import envCompatible from 'vite-plugin-env-compatible';

export default defineConfig(() => {
    return {
        plugins: [
            react(),
            envCompatible({ prefix: 'REACT_APP' })
        ],
        server: {
            port: 3000,
            open: true,
        },
        build: {
            outDir: 'build',
            loader: { '.js': 'jsx' }
        },
        resolve: {
            alias: {
                "src": "/src",
            },
        },
        esbuild: {
            loader: "jsx",
            include: /src\/.*\.jsx?$/,
            exclude: [],
        },
        optimizeDeps: {
            esbuildOptions: {
                loader: {
                    '.js': 'jsx',
                },
            },
        },
    };
});
