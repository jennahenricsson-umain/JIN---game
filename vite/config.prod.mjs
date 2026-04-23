import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    publicDir: 'public',
    build: {
        outDir: 'dist',
        minify: 'terser',
        target: 'esnext',   // for deployment, stops vite from rewriting code for old browsers

    },
});
