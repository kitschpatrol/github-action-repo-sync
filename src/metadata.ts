import { getMetadata } from 'metascope'

export type RepoMetadata = {
	description: string
	homepage: string
	topics: string[]
}

/**
 * Parse metadata from project config files
 */
export async function parseMetadata(): Promise<RepoMetadata> {
	// If the directory contains a metadata.json style file,
	// that overrides everything else!
	const metadata = await getMetadata({
		offline: true,
		path: '.',
		template: 'metadata',
		workspaces: false,
	})

	return {
		description: metadata.description ?? '',
		homepage: metadata.homepage ?? '',
		topics: metadata.topics ?? [],
	}
}
