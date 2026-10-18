// Standalone distribution: no application shell, Svelte or public demo assets.
export default {
  publicDir: false,
  build: {
    outDir: 'assets/runtime',
    emptyOutDir: true,
    lib: {
      entry: {
        runtime: 'src/index.ts',
        compile: 'src/compile.ts',
        timeline: 'src/timeline.ts',
        helpers: 'src/helpers.ts',
        'export-mp4': 'src/export-mp4.ts',
        'export-gif': 'src/export-gif.ts',
        'export-controls': 'src/export-controls.ts',
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
  },
};
