import type { Plugin } from 'esbuild'
import { build } from 'esbuild'
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Plugin that copies tree-sitter WASM files to the output directory and patches
 * the bundle to resolve grammar paths correctly.
 *
 * web-tree-sitter.wasm goes directly in outdir (web-tree-sitter looks for it
 * relative to the script directory).
 *
 * Grammar WASMs go in outdir/grammars/ and the bundle is patched to reference
 * `./grammars/` instead of `../grammars/` (the original path in the codemeta
 * library's source).
 */
function treeSitterWasmPlugin(): Plugin {
	return {
		name: 'tree-sitter-wasm',
		setup(pluginBuild) {
			pluginBuild.onEnd(async (result) => {
				if (result.errors.length > 0) return

				const outdir = pluginBuild.initialOptions.outdir ?? 'dist'
				const grammarsDirectory = join(outdir, 'grammars')
				await mkdir(grammarsDirectory, { recursive: true })

				// Find web-tree-sitter.wasm (transitive dep via @kitschpatrol/codemeta)
				const webTsDirectory = await findPackageDirectory('web-tree-sitter')
				await copyFile(
					join(webTsDirectory, 'web-tree-sitter.wasm'),
					join(outdir, 'web-tree-sitter.wasm'),
				)

				// Copy grammar WASMs from codemeta's vendored grammars
				const codemetaGrammars = join(
					'node_modules',
					'@kitschpatrol',
					'codemeta',
					'dist',
					'grammars',
				)
				// eslint-disable-next-line unicorn/no-await-expression-member
				const wasmFiles = (await readdir(codemetaGrammars)).filter((f) => f.endsWith('.wasm'))
				await Promise.all(
					wasmFiles.map(async (f) =>
						copyFile(join(codemetaGrammars, f), join(grammarsDirectory, f)),
					),
				)

				// Patch the bundle: change '../grammars/' to './grammars/' so the paths
				// resolve relative to dist/index.js instead of a non-existent parent dir
				const bundlePath = join(outdir, 'index.js')
				const content = await readFile(bundlePath, 'utf8')
				await writeFile(bundlePath, content.replaceAll('../grammars/', './grammars/'))
			})
		},
	}
}

/** Walk up from node_modules to find a package directory by name. */
async function findPackageDirectory(packageName: string): Promise<string> {
	const entries = await readdir('node_modules/.pnpm', { withFileTypes: true })
	for (const entry of entries) {
		if (entry.isDirectory() && entry.name.startsWith(`${packageName}@`)) {
			const candidate = join('node_modules/.pnpm', entry.name, 'node_modules', packageName)
			try {
				await readdir(candidate)
				return candidate
			} catch {
				// Continue searching
			}
		}
	}

	throw new Error(`Could not find package: ${packageName}`)
}

await build({
	banner: {
		// Provide a global `require` for CJS dependencies (tunnel, @actions/*)
		// that use require() for Node built-in modules.
		js: 'import{createRequire as __esbuild_cr}from"module";const require=__esbuild_cr(import.meta.url);',
	},
	bundle: true,
	entryPoints: ['src/index.ts'],
	format: 'esm',
	outdir: 'dist',
	platform: 'node',
	plugins: [treeSitterWasmPlugin()],
	target: 'node22',
})
