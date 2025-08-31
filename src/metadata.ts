import { parseJSON, parseTOML, parseYAML } from 'confbox'
import fs from 'node:fs/promises'
import path from 'node:path'

export type RepoMetadata = {
	description: string | undefined
	homepage: string | undefined
	topics: string[]
}

// Type guard asserts string or undefined and returns undefined if not
function isString(value: unknown): string | undefined {
	if (typeof value === 'string') {
		return value
	}
	return undefined
}

function isStringArray(value: unknown): string[] | undefined {
	if (Array.isArray(value)) {
		return value.every((v) => typeof v === 'string') ? value : undefined
	}
	return undefined
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

// eslint-disable-next-line ts/no-explicit-any
async function loadFile(filePath: string): Promise<Record<string, any> | undefined> {
	try {
		const content = await fs.readFile(filePath, 'utf8')
		const type = path.extname(filePath).slice(1)
		switch (type) {
			case 'json': {
				return await parseJSON(content)
			}
			case 'toml': {
				return await parseTOML(content)
			}
			case 'yaml':
			case 'yml': {
				return await parseYAML(content)
			}
			default: {
				console.error(`Unsupported file type: ${type}`)
				return undefined
			}
		}
	} catch {
		return undefined
	}
}

/**
 * Parse metadata from project config files
 */
export async function parseMetadata(): Promise<RepoMetadata> {
	/* eslint-disable-next-line ts/no-explicit-any */
	const parsers: Record<string, (content: Record<string, any>) => RepoMetadata> = {
		/* eslint-disable ts/no-unsafe-member-access */
		'metadata.json': (content) => ({
			description: isString(content.description),
			homepage: isString(content.homepage ?? content.url ?? content.repository ?? content.website),
			topics: isStringArray(content.keywords ?? content.tags ?? content.topics) ?? [],
		}),
		'metadata.yaml': (content) => ({
			description: isString(content.description),
			homepage: isString(content.homepage ?? content.url ?? content.repository ?? content.website),
			topics: isStringArray(content.keywords ?? content.tags ?? content.topics) ?? [],
		}),
		'metadata.yml': (content) => ({
			description: isString(content.description),
			homepage: isString(content.homepage ?? content.url ?? content.repository ?? content.website),
			topics: isStringArray(content.keywords ?? content.tags ?? content.topics) ?? [],
		}),
		'package.json': (content) => ({
			description: isString(content.description),
			homepage: isString(content.homepage ?? content.repository?.url),
			topics: isStringArray(content.keywords) ?? [],
		}),
		// eslint-disable-next-line complexity
		'pyproject.toml': (content) => ({
			description: isString(content.project?.description ?? content.tool?.poetry?.description),
			homepage: isString(
				content.project?.urls?.homepage ??
					content.project?.urls?.repository ??
					content.tool?.poetry?.homepage ??
					content.tool?.poetry?.repository,
			),
			topics: isStringArray(content.project?.keywords ?? content.tool?.poetry?.keywords) ?? [],
		}),
		/* eslint-enable ts/no-unsafe-member-access */
	}

	let repoMetadata: RepoMetadata = {
		description: undefined,
		homepage: undefined,
		topics: [],
	}

	for (const [filePath, parser] of Object.entries(parsers)) {
		const content = await loadFile(filePath)
		if (content) {
			repoMetadata = merge(repoMetadata, parser(content))
		}
	}

	return repoMetadata
}
