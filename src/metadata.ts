import { discover, generate } from '@kitschpatrol/codemeta'

export type RepoMetadata = {
	description: string | undefined
	homepage: string | undefined
	topics: string[]
}

/**
 * Parse metadata from project config files
 */
export async function parseMetadata(): Promise<RepoMetadata> {
	// If the directory contains a metadata.json style file,
	// that overrides everything else
	const discoveredFiles = await discover('.')
	const metadataFilePath = discoveredFiles.find(
		(value) => value.parserName === 'metadata',
	)?.filePath
	const allFilePaths = discoveredFiles.map((value) => value.filePath)

	const codeMeta = await generate(metadataFilePath ?? allFilePaths, {
		basic: true,
	})

	return {
		description: codeMeta.description ?? '',
		homepage: codeMeta.url ?? codeMeta.codeRepository ?? '',
		topics: codeMeta.keywords ?? [],
	}
}
