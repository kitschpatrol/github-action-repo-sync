import type {
	BuildResult,
	OnLoadArgs,
	OnLoadResult,
	OnResolveArgs,
	OnResolveResult,
	Plugin,
	PluginBuild,
} from 'esbuild'
import { build } from 'esbuild'
import { copyFile, mkdir, readdir, realpath } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'

// Plugin filters run in Go's regexp engine, which rejects the `v` flag
// eslint-disable-next-line require-unicode-regexp
const TOKEI_PACKAGE_REGEX = /^@kitschpatrol\/tokei/
// eslint-disable-next-line require-unicode-regexp
const MATCH_ALL_REGEX = /.*/

/**
 * Plugin that stubs out `@kitschpatrol/tokei` and its native platform packages.
 * The tokei native addon is used by metascope's code-stats source, which
 * requires platform-specific binaries that can't be bundled by esbuild.
 */
function nativeAddonStubPlugin(): Plugin {
	return {
		name: 'native-addon-stub',
		setup(pluginBuild: PluginBuild): void {
			pluginBuild.onResolve(
				{ filter: TOKEI_PACKAGE_REGEX },
				(args: OnResolveArgs): OnResolveResult => ({
					namespace: 'native-stub',
					path: args.path,
				}),
			)
			pluginBuild.onLoad(
				{ filter: MATCH_ALL_REGEX, namespace: 'native-stub' },
				(_args: OnLoadArgs): OnLoadResult => ({
					contents: 'export default {}; export function tokei() { return {} }',
					loader: 'js',
				}),
			)
		},
	}
}

/**
 * Resolve web-tree-sitter's WASM from metascope's own location, so the copied
 * WASM always matches the web-tree-sitter JS that esbuild bundles.
 */
async function resolveWebTreeSitterWasm(): Promise<string> {
	const metascopePackage = await realpath(join('node_modules', 'metascope', 'package.json'))
	return createRequire(metascopePackage).resolve('web-tree-sitter/web-tree-sitter.wasm')
}

/**
 * Plugin that copies tree-sitter WASM files to the output directory.
 *
 * Web-tree-sitter.wasm goes directly in outdir (web-tree-sitter looks for it
 * relative to the script directory).
 *
 * Grammar WASMs go in outdir/grammars/ — the bundle configures metascope's
 * grammar directory via setGrammarDirectory() in src/index.ts.
 */
function treeSitterWasmPlugin(): Plugin {
	return {
		name: 'tree-sitter-wasm',
		setup(pluginBuild: PluginBuild): void {
			pluginBuild.onEnd(async (result: BuildResult): Promise<void> => {
				if (result.errors.length > 0) {
					return
				}

				const outdir = pluginBuild.initialOptions.outdir ?? 'dist'
				const grammarsDirectory = join(outdir, 'grammars')
				await mkdir(grammarsDirectory, { recursive: true })

				await copyFile(await resolveWebTreeSitterWasm(), join(outdir, 'web-tree-sitter.wasm'))

				// Copy grammar WASMs from metascope's vendored grammars
				const metascopeGrammars = join('node_modules', 'metascope', 'dist', 'grammars')

				// Extracted variables to satisfy strict type/lint rules naturally
				const allMetascopeFiles: string[] = await readdir(metascopeGrammars)
				const wasmFiles: string[] = allMetascopeFiles.filter((f: string) => f.endsWith('.wasm'))

				await Promise.all(
					wasmFiles.map(async (f: string) =>
						copyFile(join(metascopeGrammars, f), join(grammarsDirectory, f)),
					),
				)
			})
		},
	}
}

await build({
	banner: {
		// Provide a global `require` for CJS dependencies (tunnel, @actions/*)
		// that use require() for Node built-in modules.
		js: 'import{createRequire as __esbuild_cr}from"module";const require=__esbuild_cr(import.meta.url);',
	},
	bundle: true,
	entryPoints: ['src/index.ts'],
	// Optional peer of lognow (via metascope), only imported inside Electron
	external: ['electron'],
	format: 'esm',
	outdir: 'dist',
	platform: 'node',
	plugins: [nativeAddonStubPlugin(), treeSitterWasmPlugin()],
	target: 'node22',
})
