const { compile } = require('@tailwindcss/node');
const { Scanner } = require('@tailwindcss/oxide');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const srcCss = path.join(rootDir, 'src/app/globals.src.css');
const outCss = path.join(rootDir, 'src/app/globals.css');

async function build() {
  const t0 = Date.now();
  try {
    const css = fs.readFileSync(srcCss, 'utf8');
    const compiler = await compile(css, {
      base: rootDir,
      from: srcCss,
      onDependency: () => {},
    });
    const scanner = new Scanner({
      sources: [{ base: rootDir, pattern: 'src/**/*.{ts,tsx,js,jsx}', negated: false }]
    });
    const candidates = scanner.scan();
    const compiled = compiler.build(candidates);
    fs.writeFileSync(outCss, compiled);
    console.log(`[build-css] Built ${candidates.length} candidates in ${Date.now() - t0}ms (${(compiled.length / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error('[build-css] Build failed:', err.message);
  }
}

build();

if (process.argv.includes('--watch')) {
  console.log('[build-css] Watching src/ for changes...');
  let timeout = null;
  fs.watch(path.join(rootDir, 'src'), { recursive: true }, (event, filename) => {
    if (!filename || filename === 'app/globals.css' || filename === 'globals.css') return;
    if (filename.endsWith('.tsx') || filename.endsWith('.ts') || filename.endsWith('.css')) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        build();
      }, 100);
    }
  });
}
