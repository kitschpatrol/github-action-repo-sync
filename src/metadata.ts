import type { SourceName } from 'metascope'
import { getMetadata } from 'metascope'

export type RepoMetadata = {
	description: string | undefined
	homepage: string | undefined
	topics: string[]
}

// Only load sources that the metadata template actually reads
const sources: SourceName[] = [
	'arduinoLibraryProperties',
	'cinderCinderblockXml',
	'codemetaJson',
	'goGoMod',
	'javaPomXml',
	'metadataFile',
	'nodePackageJson',
	'obsidianPluginManifestJson',
	'openframeworksAddonConfigMk',
	'openframeworksInstallXml',
	'processingLibraryProperties',
	'publiccodeYaml',
	'pythonPkgInfo',
	'pythonPyprojectToml',
	'pythonSetupCfg',
	'pythonSetupPy',
	'rubyGemspec',
	'rustCargoToml',
	'xcodeInfoPlist',
]

/**
 * Parse metadata from project config files
 */
export async function parseMetadata(): Promise<RepoMetadata> {
	const metadata = await getMetadata({
		offline: true,
		path: '.',
		sources,
		template: 'metadata',
		workspaces: false,
	})

	return {
		description: metadata.description ?? '',
		homepage: metadata.homepage ?? '',
		topics: metadata.topics ?? [],
	}
}
