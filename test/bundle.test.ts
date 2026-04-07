/* eslint-disable ts/naming-convention */
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const FOUND_METADATA_REGEX = /Found metadata: (.+)/
const execFileAsync = promisify(execFile)
const testDirectory = path.dirname(fileURLToPath(import.meta.url))
const fixturesDirectory = path.join(testDirectory, 'fixtures')
const distributionEntry = path.resolve(testDirectory, '..', 'dist', 'index.js')

/**
 * Run the dist bundle in a temp directory containing a fixture file.
 * The action logs "Found metadata: {...}" before calling the GitHub API,
 * so we can capture that output to verify tree-sitter parsing works
 * even though the API call will fail (no valid token).
 */
async function runDistributionWithFixture(
	fixtureName: string,
	targetFileName: string,
): Promise<string> {
	const tempDirectory = path.join(testDirectory, `temp-dist-${fixtureName.replaceAll('.', '-')}`)

	await fs.mkdir(tempDirectory, { recursive: true })
	await fs.copyFile(
		path.join(fixturesDirectory, fixtureName),
		path.join(tempDirectory, targetFileName),
	)

	try {
		const { stdout } = await execFileAsync('node', [distributionEntry], {
			cwd: tempDirectory,
			env: {
				...process.env,
				INPUT_TOKEN: 'fake-token',
			},
		})
		return stdout
	} catch (error) {
		// The action will fail at the GitHub API call, but we still get stdout
		// eslint-disable-next-line ts/no-unsafe-type-assertion
		const execError = error as { stdout?: string }
		return execError.stdout ?? ''
	} finally {
		await fs.rm(tempDirectory, { recursive: true })
	}
}

describe('dist bundle tree-sitter grammar loading', () => {
	let originalCwd: string

	beforeEach(() => {
		originalCwd = process.cwd()
	})

	afterEach(() => {
		process.chdir(originalCwd)
	})

	it('should parse gemspec from dist bundle', async () => {
		const stdout = await runDistributionWithFixture('gemspec-basic.gemspec', 'gemspec.gemspec')

		expect(stdout).toContain('Found metadata:')

		const match = FOUND_METADATA_REGEX.exec(stdout)
		expect(match).not.toBeNull()

		// eslint-disable-next-line ts/no-unsafe-type-assertion
		const metadata = JSON.parse(match![1]) as Record<string, unknown>
		expect(metadata.description).toBe('A test Ruby gem for metadata sync')
		expect(metadata.homepage).toBe('https://example.com/ruby-gem')
	})

	it('should parse setup.py from dist bundle', async () => {
		const stdout = await runDistributionWithFixture('setup-py-basic.py', 'setup.py')

		expect(stdout).toContain('Found metadata:')

		const match = FOUND_METADATA_REGEX.exec(stdout)
		expect(match).not.toBeNull()

		// eslint-disable-next-line ts/no-unsafe-type-assertion
		const metadata = JSON.parse(match![1]) as Record<string, unknown>
		expect(metadata.description).toBe('A test Python package for metadata sync')
		expect(metadata.homepage).toBe('https://example.com/python-package')
		expect(metadata.topics).toEqual(['python', 'test', 'metadata'])
	})
})
