import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parseMetadata } from '../src/metadata'

const testDirectory = path.dirname(fileURLToPath(import.meta.url))
const fixturesDirectory = path.join(testDirectory, 'fixtures')

// Helper function to set up test with fixture file
async function testWithFixture(
	fixtureName: string,
	directories: string[],
	testName?: string,
): Promise<string> {
	const targetFileName = fixtureName.includes('-')
		? fixtureName.split('-')[0] + path.extname(fixtureName)
		: fixtureName
	const tempDirectory = path.join(
		testDirectory,
		`temp-${testName ?? fixtureName.replaceAll('.', '-')}`,
	)

	await fs.mkdir(tempDirectory, { recursive: true })
	await fs.copyFile(
		path.join(fixturesDirectory, fixtureName),
		path.join(tempDirectory, targetFileName),
	)

	directories.push(tempDirectory)
	process.chdir(tempDirectory)
	return tempDirectory
}

describe('parseMetadata', () => {
	let originalCwd: string
	const tempDirectories: string[] = []

	beforeEach(() => {
		originalCwd = process.cwd()
	})

	afterEach(async () => {
		process.chdir(originalCwd)
		for (const directory of tempDirectories) {
			await fs.rm(directory, { force: true, recursive: true })
		}

		tempDirectories.length = 0
	})

	it('should parse package.json metadata', async () => {
		await testWithFixture('package-basic.json', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'A test package for GitHub action sync',
			homepage: 'https://example.com',
			topics: ['test', 'github-action', 'metadata'],
		})
	})

	it('should parse pyproject.toml metadata with project section', async () => {
		await testWithFixture('pyproject-project-only.toml', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Python project description',
			homepage: 'https://python-home.com',
			topics: ['python', 'test'],
		})
	})

	it('should parse pyproject.toml metadata with poetry section', async () => {
		await testWithFixture('pyproject-poetry-only.toml', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Poetry project description',
			homepage: 'https://poetry-home.com',
			topics: ['poetry', 'test'],
		})
	})

	it('should parse metadata.json', async () => {
		await testWithFixture('metadata-basic.json', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'JSON metadata file for testing',
			homepage: 'https://json-example.com',
			topics: ['json', 'metadata', 'testing'],
		})
	})

	it('should parse metadata.yml', async () => {
		await testWithFixture('metadata-basic.yml', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'YAML metadata file for testing',
			homepage: 'https://yaml-example.com',
			topics: ['yaml', 'metadata', 'testing'],
		})
	})

	it('should parse metadata.yaml', async () => {
		await testWithFixture('metadata-basic.yaml', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Extended YAML metadata file for testing',
			homepage: 'https://extended-yaml-example.com',
			topics: ['extended-yaml', 'metadata', 'comprehensive'],
		})
	})

	it('should parse codemeta.json', async () => {
		await testWithFixture('codemeta-basic.json', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'A test project using CodeMeta metadata format',
			homepage: 'https://codemeta-example.com',
			topics: ['codemeta', 'metadata', 'testing'],
		})
	})

	it('should use codeRepository as homepage fallback in codemeta.json', async () => {
		await testWithFixture('codemeta-coderepository-fallback.json', tempDirectories)

		const metadata = await parseMetadata()

		console.log(metadata)

		expect(metadata).toEqual({
			description: 'Testing codeRepository fallback when url is missing',
			homepage: 'https://github.com/test/codemeta-fallback',
			topics: ['codemeta', 'fallback', 'testing'],
		})
	})

	it('should parse comma-delimited keywords string in codemeta.json', async () => {
		await testWithFixture('codemeta-string-keywords.json', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Testing comma-delimited keywords string',
			homepage: 'https://codemeta-string-keywords.com',
			topics: ['optimization', 'stochastic approximation', 'spsa'],
		})
	})

	it('should normalize git+ prefix and .git suffix in codemeta.json codeRepository', async () => {
		await testWithFixture('codemeta-git-url.json', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Testing git+ prefix and .git suffix normalization',
			homepage: 'https://github.com/test/codemeta-git-url',
			topics: ['codemeta', 'git-url', 'testing'],
		})
	})

	it('should normalize git+ prefix and .git suffix in package.json repository.url', async () => {
		await testWithFixture('package-git-url.json', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Testing package.json with git URL normalization',
			homepage: 'https://github.com/test/package-git-url',
			topics: ['package', 'git-url', 'testing'],
		})
	})

	it('should normalize git+ prefix and .git suffix in metadata.json repository', async () => {
		await testWithFixture('metadata-git-url.json', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Testing metadata.json with git URL normalization',
			homepage: 'https://github.com/test/metadata-git-url',
			topics: ['metadata', 'git-url', 'testing'],
		})
	})

	it('should merge metadata from multiple files with priority', async () => {
		const tempDirectory = path.join(testDirectory, 'temp-merge')
		await fs.mkdir(tempDirectory, { recursive: true })
		tempDirectories.push(tempDirectory)

		// Copy package.json fixture
		await fs.copyFile(
			path.join(fixturesDirectory, 'package-merge-test.json'),
			path.join(tempDirectory, 'package.json'),
		)

		// Copy metadata.json fixture
		await fs.copyFile(
			path.join(fixturesDirectory, 'metadata-merge-test.json'),
			path.join(tempDirectory, 'metadata.json'),
		)

		process.chdir(tempDirectory)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Metadata description override',
			homepage: 'https://metadata-home.com',
			topics: ['metadata-keyword'],
		})
	})

	it('should handle missing files gracefully', async () => {
		const tempDirectory = path.join(testDirectory, 'temp-empty')
		await fs.mkdir(tempDirectory, { recursive: true })
		tempDirectories.push(tempDirectory)

		process.chdir(tempDirectory)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: '',
			homepage: '',
			topics: [],
		})
	})

	it('should handle invalid JSON gracefully', async () => {
		await testWithFixture('package-invalid.json', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: '',
			homepage: '',
			topics: [],
		})
	})

	it('should handle repository URL fallback in package.json', async () => {
		await testWithFixture('package-repo-fallback.json', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Test repository URL fallback',
			homepage: 'https://github.com/test/fallback-repo',
			topics: ['fallback', 'test'],
		})
	})

	it('should handle various keyword field names', async () => {
		await testWithFixture('metadata-keyword-variants.json', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata.topics).toEqual(['tag1', 'tag2'])
	})

	// Test metadata.json fallback scenarios
	it('should use url as homepage fallback in metadata.json', async () => {
		await testWithFixture('metadata-url-fallback.json', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Testing URL fallback instead of homepage',
			homepage: 'https://url-fallback-example.com',
			topics: ['url-fallback', 'testing'],
		})
	})

	it('should use repository as homepage fallback in metadata.json', async () => {
		await testWithFixture('metadata-repository-fallback.json', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Testing repository fallback for homepage',
			homepage: 'https://repository-fallback-example.com',
			topics: ['repository-fallback', 'testing'],
		})
	})

	it('should use website as homepage fallback in metadata.json', async () => {
		await testWithFixture('metadata-website-fallback.json', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Testing website fallback for homepage',
			homepage: 'https://website-fallback-example.com',
			topics: ['website-fallback', 'testing'],
		})
	})

	it('should use tags as topics fallback in metadata.json', async () => {
		await testWithFixture('metadata-tags-fallback.json', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Testing tags fallback for topics',
			homepage: 'https://tags-fallback-example.com',
			topics: ['tag1', 'tag2', 'tags-fallback'],
		})
	})

	it('should use topics as final fallback in metadata.json', async () => {
		await testWithFixture('metadata-topics-fallback.json', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Testing topics fallback when no keywords or tags',
			homepage: 'https://topics-fallback-example.com',
			topics: ['topic1', 'topic2', 'topics-fallback'],
		})
	})

	// Test pyproject.toml fallback scenarios
	it('should use project.urls.repository as homepage fallback in pyproject.toml', async () => {
		await testWithFixture('pyproject-project-urls.toml', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Testing project.urls fallback',
			homepage: 'https://project-repository-fallback.com',
			topics: ['project', 'urls', 'fallback'],
		})
	})

	it('should use tool.poetry fallbacks in pyproject.toml', async () => {
		await testWithFixture('pyproject-poetry-only.toml', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Poetry project description',
			homepage: 'https://poetry-home.com',
			topics: ['poetry', 'test'],
		})
	})

	// Test package.json repository.url fallback
	it('should use repository.url as homepage fallback in package.json', async () => {
		await testWithFixture('package-repository-fallback.json', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Testing package.json repository.url fallback',
			homepage: 'https://package-repository-fallback.com',
			topics: ['repository', 'url', 'fallback'],
		})
	})

	// Test tree-sitter grammar parsing (Ruby gemspec)
	it('should parse gemspec metadata', async () => {
		await testWithFixture('gemspec-basic.gemspec', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'A test Ruby gem for metadata sync',
			homepage: 'https://example.com/ruby-gem',
			topics: [],
		})
	})

	// Test tree-sitter grammar parsing (Python setup.py)
	it('should parse setup.py metadata', async () => {
		await testWithFixture('setup-py-basic.py', tempDirectories)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'A test Python package for metadata sync',
			homepage: 'https://example.com/python-package',
			topics: ['python', 'test', 'metadata'],
		})
	})

	// Test priority order - ensure higher priority files override lower priority ones
	it('should respect fallback priority order across different files', async () => {
		const tempDirectory = path.join(testDirectory, 'temp-priority-test')
		await fs.mkdir(tempDirectory, { recursive: true })
		tempDirectories.push(tempDirectory)

		// Copy metadata.json fixture with url fallback
		await fs.copyFile(
			path.join(fixturesDirectory, 'metadata-priority-test.json'),
			path.join(tempDirectory, 'metadata.json'),
		)

		// Copy package.json fixture that should be overridden
		await fs.copyFile(
			path.join(fixturesDirectory, 'package-priority-test.json'),
			path.join(tempDirectory, 'package.json'),
		)

		process.chdir(tempDirectory)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Metadata description', // Metadata.json wins
			homepage: 'https://metadata-url.com', // Metadata.json url wins
			topics: ['metadata-tag'], // Metadata.json tags win
		})
	})
})
