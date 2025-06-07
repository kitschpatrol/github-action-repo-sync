import fs from 'fs/promises'
import path from 'path'
import { parseJSON, parseTOML, parseYAML } from 'confbox'

export type RepoMetadata = {
	description?: string
	homepage?: string
	topics?: string[]
}

function merge<T>(target: T, source: Partial<T>): T {
	const result = { ...target }

	for (const key in source) {
		if (source[key] !== undefined) {
			result[key] = source[key]!
		}
	}

	return result
}

async function loadFile(filePath: string): Promise<Record<string, any> | undefined> {
	try {
		const content = await fs.readFile(filePath, 'utf8')
		const type = path.extname(filePath).slice(1)
		switch (type) {
			case 'json':
				return parseJSON(content)
			case 'toml':
				return parseTOML(content)
			case 'yaml':
				return parseYAML(content)
			default:
				console.error(`Unsupported file type: ${type}`)
				return undefined
		}
	} catch (error) {
		return undefined
	}
}

export async function parseMetadata(): Promise<RepoMetadata> {
	const parsers: Record<string, (content: Record<string, any>) => RepoMetadata> = {
		'pyproject.toml': (content) => ({
			description: content.project?.description ?? content.tool?.poetry?.description,
			homepage:
				content.project?.urls?.homepage ??
				content.project?.urls?.repository ??
				content.tool?.poetry?.homepage ??
				content.tool?.poetry?.repository,
			topics: content.project?.keywords ?? content.tool?.poetry?.keywords,
		}),
		'package.json': (content) => ({
			description: content.description,
			homepage: content.homepage ?? content.repository?.url,
			topics: content.keywords,
		}),
		'metadata.json': (content) => ({
			description: content.description,
			homepage: content.homepage ?? content.url ?? content.repository ?? content.website,
			topics: content.keywords ?? content.tags ?? content.topics,
		}),
		'metadata.yml': (content) => ({
			description: content.description,
			homepage: content.homepage ?? content.url ?? content.repository ?? content.website,
			topics: content.keywords ?? content.tags ?? content.topics,
		}),
		'metadata.yaml': (content) => ({
			description: content.description,
			homepage: content.homepage ?? content.url ?? content.repository ?? content.website,
			topics: content.keywords ?? content.tags ?? content.topics,
		}),
	}

	let repoMetadata: RepoMetadata = {
		description: undefined,
		homepage: undefined,
		topics: undefined,
	}

	for (const [filePath, parser] of Object.entries(parsers)) {
		const content = await loadFile(filePath)
		if (content) {
			repoMetadata = merge(repoMetadata, parser(content))
		}
	}

	return repoMetadata
}
