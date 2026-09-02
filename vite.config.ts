import {defineConfig} from 'vite';

export default defineConfig({
  // Relative asset URLs keep the build usable from a static host (Vercel), from
  // a sub path, and straight from the file system. Set ES_MOCKUP_BASE to pin an
  // absolute base if the app is ever served from a CDN with a fixed prefix.
  base: process.env.ES_MOCKUP_BASE ?? './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    // The Scout icon font must stay a separate file: it is fetched at runtime
    // and re-encoded for the exports, and as its own asset it gets the
    // immutable cache header configured in vercel.json.
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        // The generated Scout tables only change when the framework version is
        // bumped, so they are worth caching separately from the app code.
        manualChunks: {
          'scout-data': [
            './src/model/scoutColors.generated.ts',
            './src/model/scoutIcons.generated.ts'
          ]
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  }
});
