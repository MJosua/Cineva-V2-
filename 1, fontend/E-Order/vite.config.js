
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import envCompatible from 'vite-plugin-env-compatible';

export default defineConfig(() => {
    return {
        plugins: [
            react(),
            envCompatible({ prefix: 'REACT_APP' })
        ],
        define: {
            'process.env': {}
        },
        envPrefix: 'REACT_APP_',
        server: {
            port: 3000,
            open: true,
        },
        build: {
            outDir: 'build',
            loader: { '.js': 'jsx' },
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            if (id.includes('react-icons')) {
                                return 'vendor-icons';
                            }
                            if (id.includes('@chakra-ui') || id.includes('@emotion') || id.includes('framer-motion')) {
                                return 'vendor-ui';
                            }
                            return 'vendor';
                        }
                    }
                }
            }
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
