import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parseMetadata } from '../src/metadata'

const testDirectory = path.dirname(fileURLToPath(import.meta.url))
const fixturesDirectory = path.join(testDirectory, 'fixtures')

// Helper function to set up test with fixture file
async function testWithFixture(fixtureName: string, testName?: string): Promise<string> {
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

	process.chdir(tempDirectory)
	return tempDirectory
}

describe('parseMetadata', () => {
	let originalCwd: string

	beforeEach(() => {
		originalCwd = process.cwd()
	})

	afterEach(() => {
		process.chdir(originalCwd)
	})

	it('should parse package.json metadata', async () => {
		const tempDirectory = await testWithFixture('package-basic.json')

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'A test package for GitHub action sync',
			homepage: 'https://example.com',
			topics: ['test', 'github-action', 'metadata'],
		})

		await fs.rm(tempDirectory, { recursive: true })
	})

	it('should parse pyproject.toml metadata with project section', async () => {
		const tempDirectory = await testWithFixture('pyproject-project-only.toml')

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Python project description',
			homepage: 'https://python-home.com',
			topics: ['python', 'test'],
		})

		await fs.rm(tempDirectory, { recursive: true })
	})

	it('should parse pyproject.toml metadata with poetry section', async () => {
		const tempDirectory = await testWithFixture('pyproject-poetry-only.toml')

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Poetry project description',
			homepage: 'https://poetry-home.com',
			topics: ['poetry', 'test'],
		})

		await fs.rm(tempDirectory, { recursive: true })
	})

	it('should parse metadata.json', async () => {
		const tempDirectory = await testWithFixture('metadata-basic.json')

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'JSON metadata file for testing',
			homepage: 'https://json-example.com',
			topics: ['json', 'metadata', 'testing'],
		})

		await fs.rm(tempDirectory, { recursive: true })
	})

	it('should parse metadata.yml', async () => {
		const tempDirectory = await testWithFixture('metadata-basic.yml')

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'YAML metadata file for testing',
			homepage: 'https://yaml-example.com',
			topics: ['yaml', 'metadata', 'testing'],
		})

		await fs.rm(tempDirectory, { recursive: true })
	})

	it('should parse metadata.yaml', async () => {
		const tempDirectory = await testWithFixture('metadata-basic.yaml')

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Extended YAML metadata file for testing',
			homepage: 'https://extended-yaml-example.com',
			topics: ['extended-yaml', 'metadata', 'comprehensive'],
		})

		await fs.rm(tempDirectory, { recursive: true })
	})

	it('should merge metadata from multiple files with priority', async () => {
		const tempDirectory = path.join(testDirectory, 'temp-merge')
		await fs.mkdir(tempDirectory, { recursive: true })

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
			description: 'Package description',
			homepage: 'https://metadata-home.com',
			topics: ['package-keyword'],
		})

		await fs.rm(tempDirectory, { recursive: true })
	})

	it('should handle missing files gracefully', async () => {
		const tempDirectory = path.join(testDirectory, 'temp-empty')
		await fs.mkdir(tempDirectory, { recursive: true })

		process.chdir(tempDirectory)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: undefined,
			homepage: undefined,
			topics: [],
		})

		await fs.rm(tempDirectory, { recursive: true })
	})

	it('should handle invalid JSON gracefully', async () => {
		const tempDirectory = await testWithFixture('package-invalid.json')

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: undefined,
			homepage: undefined,
			topics: [],
		})

		await fs.rm(tempDirectory, { recursive: true })
	})

	it('should handle repository URL fallback in package.json', async () => {
		const tempDirectory = await testWithFixture('package-repo-fallback.json')

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Test repository URL fallback',
			homepage: 'https://github.com/test/fallback-repo',
			topics: ['fallback', 'test'],
		})

		await fs.rm(tempDirectory, { recursive: true })
	})

	it('should handle various keyword field names', async () => {
		const tempDirectory = await testWithFixture('metadata-keyword-variants.json')

		const metadata = await parseMetadata()

		expect(metadata.topics).toEqual(['tag1', 'tag2'])

		await fs.rm(tempDirectory, { recursive: true })
	})

	// Test metadata.json fallback scenarios
	it('should use url as homepage fallback in metadata.json', async () => {
		const tempDirectory = await testWithFixture('metadata-url-fallback.json')

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Testing URL fallback instead of homepage',
			homepage: 'https://url-fallback-example.com',
			topics: ['url-fallback', 'testing'],
		})

		await fs.rm(tempDirectory, { recursive: true })
	})

	it('should use repository as homepage fallback in metadata.json', async () => {
		const tempDirectory = await testWithFixture('metadata-repository-fallback.json')

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Testing repository fallback for homepage',
			homepage: 'https://repository-fallback-example.com',
			topics: ['repository-fallback', 'testing'],
		})

		await fs.rm(tempDirectory, { recursive: true })
	})

	it('should use website as homepage fallback in metadata.json', async () => {
		const tempDirectory = await testWithFixture('metadata-website-fallback.json')

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Testing website fallback for homepage',
			homepage: 'https://website-fallback-example.com',
			topics: ['website-fallback', 'testing'],
		})

		await fs.rm(tempDirectory, { recursive: true })
	})

	it('should use tags as topics fallback in metadata.json', async () => {
		const tempDirectory = await testWithFixture('metadata-tags-fallback.json')

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Testing tags fallback for topics',
			homepage: 'https://tags-fallback-example.com',
			topics: ['tag1', 'tag2', 'tags-fallback'],
		})

		await fs.rm(tempDirectory, { recursive: true })
	})

	it('should use topics as final fallback in metadata.json', async () => {
		const tempDirectory = await testWithFixture('metadata-topics-fallback.json')

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Testing topics fallback when no keywords or tags',
			homepage: 'https://topics-fallback-example.com',
			topics: ['topic1', 'topic2', 'topics-fallback'],
		})

		await fs.rm(tempDirectory, { recursive: true })
	})

	// Test pyproject.toml fallback scenarios
	it('should use project.urls.repository as homepage fallback in pyproject.toml', async () => {
		const tempDirectory = await testWithFixture('pyproject-project-urls.toml')

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Testing project.urls fallback',
			homepage: 'https://project-repository-fallback.com',
			topics: ['project', 'urls', 'fallback'],
		})

		await fs.rm(tempDirectory, { recursive: true })
	})

	it('should use tool.poetry fallbacks in pyproject.toml', async () => {
		const tempDirectory = await testWithFixture('pyproject-poetry-only.toml')

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Poetry project description',
			homepage: 'https://poetry-home.com',
			topics: ['poetry', 'test'],
		})

		await fs.rm(tempDirectory, { recursive: true })
	})

	// Test package.json repository.url fallback
	it('should use repository.url as homepage fallback in package.json', async () => {
		const tempDirectory = await testWithFixture('package-repository-fallback.json')

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Testing package.json repository.url fallback',
			homepage: 'https://package-repository-fallback.com',
			topics: ['repository', 'url', 'fallback'],
		})

		await fs.rm(tempDirectory, { recursive: true })
	})

	// Test priority order - ensure higher priority files override lower priority ones
	it('should respect fallback priority order across different files', async () => {
		const tempDirectory = path.join(testDirectory, 'temp-priority-test')
		await fs.mkdir(tempDirectory, { recursive: true })

		// Copy metadata.json fixture with url fallback
		await fs.copyFile(
			path.join(fixturesDirectory, 'metadata-priority-test.json'),
			path.join(tempDirectory, 'metadata.json'),
		)

		// Copy package.json fixture that should override description but not homepage/topics
		await fs.copyFile(
			path.join(fixturesDirectory, 'package-priority-test.json'),
			path.join(tempDirectory, 'package.json'),
		)

		process.chdir(tempDirectory)

		const metadata = await parseMetadata()

		expect(metadata).toEqual({
			description: 'Package description override', // Package.json overrides
			homepage: 'https://package-repo.com', // Package.json repository.url overrides metadata url
			topics: ['package-keyword'], // Package.json keywords override metadata tags
		})

		await fs.rm(tempDirectory, { recursive: true })
	})
})
