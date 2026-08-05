import { build } from "esbuild";
import { mkdirSync, writeFileSync } from "fs";

const OUT_DIR = "dist";

mkdirSync(OUT_DIR, { recursive: true });

await build({
    entryPoints: ["index.js"],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: `${OUT_DIR}/index.js`,
    // @actions/core 3.x is ESM-only, so the bundle is ESM. Node builtins are
    // still reached via require() inside bundled dependencies, which is not
    // defined in ESM scope — this shim supplies it.
    banner: {
        js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);"
    }
});

// Node decides a file's module type from the nearest package.json, so dist/
// needs its own for the runner to load index.js as ESM. Generated here rather
// than hand-maintained so that everything in dist/ is reproducible from
// `npm run build` and can therefore be verified byte-for-byte in CI.
writeFileSync(`${OUT_DIR}/package.json`, JSON.stringify({ type: "module" }) + "\n");
