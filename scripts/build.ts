import type {
	BuildResult,
	OnLoadArgs,
	OnLoadResult,
	OnResolveArgs,
	OnResolveResult,
	Plugin,
	PluginBuild,
} from 'esbuild'
import type { Dirent } from 'node:fs'
import { build } from 'esbuild'
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Plugin that stubs out \@kitschpatrol/tokei and its native platform packages.
 * The tokei native addon is used by metascope's code-stats source, which
 * requires platform-specific binaries that can't be bundled by esbuild.
 */
function nativeAddonStubPlugin(): Plugin {
	return {
		name: 'native-addon-stub',
		setup(pluginBuild: PluginBuild): void {
			pluginBuild.onResolve(
				{ filter: /^@kitschpatrol\/tokei/ },
				(args: OnResolveArgs): OnResolveResult => ({
					namespace: 'native-stub',
					path: args.path,
				}),
			)
			pluginBuild.onLoad(
				{ filter: /.*/, namespace: 'native-stub' },
				(_args: OnLoadArgs): OnLoadResult => ({
					contents: 'export default {}; export function tokei() { return {} }',
					loader: 'js',
				}),
			)
		},
	}
}

/** Find a package directory in the pnpm store by name. */
async function findPackageDirectory(packageName: string): Promise<string> {
	const pnpmPrefix = packageName.replaceAll('/', '+')
	const entries: Dirent[] = await readdir('node_modules/.pnpm', { withFileTypes: true })
	for (const entry of entries) {
		if (entry.isDirectory() && entry.name.startsWith(`${pnpmPrefix}@`)) {
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

/**
 * Plugin that copies tree-sitter WASM files to the output directory and patches
 * the bundle to resolve grammar paths correctly.
 *
 * web-tree-sitter.wasm goes directly in outdir (web-tree-sitter looks for it
 * relative to the script directory).
 *
 * Grammar WASMs go in outdir/grammars/ and the bundle is patched to reference
 * `./grammars/` instead of `../../grammars/` (the original path in the
 * metascope library's source).
 */
function treeSitterWasmPlugin(): Plugin {
	return {
		name: 'tree-sitter-wasm',
		setup(pluginBuild: PluginBuild): void {
			pluginBuild.onEnd(async (result: BuildResult): Promise<void> => {
				if (result.errors.length > 0) return

				const outdir = pluginBuild.initialOptions.outdir ?? 'dist'
				const grammarsDirectory = join(outdir, 'grammars')
				await mkdir(grammarsDirectory, { recursive: true })

				// Find web-tree-sitter.wasm (transitive dep via metascope)
				const webTsDirectory = await findPackageDirectory('web-tree-sitter')
				await copyFile(
					join(webTsDirectory, 'web-tree-sitter.wasm'),
					join(outdir, 'web-tree-sitter.wasm'),
				)

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

				// Patch the bundle: change '../../grammars/' to './grammars/' so the paths
				// resolve relative to dist/index.js instead of a non-existent parent dir
				const bundlePath = join(outdir, 'index.js')
				const content = await readFile(bundlePath, 'utf8')
				await writeFile(bundlePath, content.replaceAll('../../grammars/', './grammars/'))
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
	format: 'esm',
	outdir: 'dist',
	platform: 'node',
	plugins: [nativeAddonStubPlugin(), treeSitterWasmPlugin()],
	target: 'node22',
})
