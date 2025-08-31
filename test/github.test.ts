import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RepoMetadata } from '../src/metadata'
import { updateRepository } from '../src/github'

// Mock the @actions/github module
vi.mock('@actions/github', () => ({
	context: {
		repo: {
			owner: 'test-owner',
			repo: 'test-repo',
		},
	},
}))

// Mock the @octokit/rest module
const mockOctokit = {
	repos: {
		get: vi.fn(),
		replaceAllTopics: vi.fn(),
		update: vi.fn(),
	},
}

vi.mock('@octokit/rest', () => ({
	// eslint-disable-next-line ts/naming-convention
	Octokit: vi.fn(() => mockOctokit),
}))

describe('updateRepository', () => {
	const testToken = 'test-token'
	const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
		// Mock implementation to silence console output in tests
	})

	beforeEach(() => {
		vi.clearAllMocks()
		consoleLogSpy.mockClear()
	})

	it('should update description when different', async () => {
		const currentRepo = {
			description: 'Old description',
			homepage: 'https://example.com',
			topics: ['old', 'topics'],
		}

		const newMetadata: RepoMetadata = {
			description: 'New description',
			homepage: 'https://example.com',
			topics: ['old', 'topics'],
		}

		mockOctokit.repos.get.mockResolvedValue({ data: currentRepo })
		mockOctokit.repos.update.mockResolvedValue({})

		await updateRepository(newMetadata, testToken)

		expect(mockOctokit.repos.update).toHaveBeenCalledWith({
			description: 'New description',
			owner: 'test-owner',
			repo: 'test-repo',
		})

		expect(consoleLogSpy).toHaveBeenCalledWith('\nDescription: New description')
		expect(consoleLogSpy).toHaveBeenCalledWith('Updating description for [test-owner/test-repo]')
	})

	it('should update homepage when different', async () => {
		const currentRepo = {
			description: 'Test description',
			homepage: 'https://old-site.com',
			topics: ['test'],
		}

		const newMetadata: RepoMetadata = {
			description: 'Test description',
			homepage: 'https://new-site.com',
			topics: ['test'],
		}

		mockOctokit.repos.get.mockResolvedValue({ data: currentRepo })
		mockOctokit.repos.update.mockResolvedValue({})

		await updateRepository(newMetadata, testToken)

		expect(mockOctokit.repos.update).toHaveBeenCalledWith({
			homepage: 'https://new-site.com',
			owner: 'test-owner',
			repo: 'test-repo',
		})

		expect(consoleLogSpy).toHaveBeenCalledWith('\nWebsite: https://new-site.com')
		expect(consoleLogSpy).toHaveBeenCalledWith('Updating homepage for [test-owner/test-repo]')
	})

	it('should update topics when different', async () => {
		const currentRepo = {
			description: 'Test description',
			homepage: 'https://example.com',
			topics: ['old', 'topics'],
		}

		const newMetadata: RepoMetadata = {
			description: 'Test description',
			homepage: 'https://example.com',
			topics: ['new', 'topics', 'added'],
		}

		mockOctokit.repos.get.mockResolvedValue({ data: currentRepo })
		mockOctokit.repos.replaceAllTopics.mockResolvedValue({})

		await updateRepository(newMetadata, testToken)

		expect(mockOctokit.repos.replaceAllTopics).toHaveBeenCalledWith({
			names: ['new', 'topics', 'added'],
			owner: 'test-owner',
			repo: 'test-repo',
		})

		expect(consoleLogSpy).toHaveBeenCalledWith('\nTopics: ["new","topics","added"]')
		expect(consoleLogSpy).toHaveBeenCalledWith('Updating topics for [test-owner/test-repo]')
	})

	it('should skip GitHub repo URL homepage', async () => {
		const currentRepo = {
			description: 'Test description',
			homepage: 'https://old-site.com',
			topics: ['test'],
		}

		const newMetadata: RepoMetadata = {
			description: 'Test description',
			homepage: 'https://github.com/test-owner/test-repo',
			topics: ['test'],
		}

		mockOctokit.repos.get.mockResolvedValue({ data: currentRepo })
		mockOctokit.repos.update.mockResolvedValue({})

		await updateRepository(newMetadata, testToken)

		expect(mockOctokit.repos.update).toHaveBeenCalledWith({
			homepage: undefined,
			owner: 'test-owner',
			repo: 'test-repo',
		})
	})

	it('should not update when metadata is the same', async () => {
		const currentRepo = {
			description: 'Same description',
			homepage: 'https://same-site.com',
			topics: ['same', 'topics'],
		}

		const newMetadata: RepoMetadata = {
			description: 'Same description',
			homepage: 'https://same-site.com',
			topics: ['same', 'topics'],
		}

		mockOctokit.repos.get.mockResolvedValue({ data: currentRepo })

		await updateRepository(newMetadata, testToken)

		expect(mockOctokit.repos.update).not.toHaveBeenCalled()
		expect(mockOctokit.repos.replaceAllTopics).not.toHaveBeenCalled()
	})

	it('should handle topics in different order as same', async () => {
		const currentRepo = {
			description: 'Test description',
			homepage: 'https://example.com',
			topics: ['b', 'a', 'c'],
		}

		const newMetadata: RepoMetadata = {
			description: 'Test description',
			homepage: 'https://example.com',
			topics: ['a', 'b', 'c'],
		}

		mockOctokit.repos.get.mockResolvedValue({ data: currentRepo })

		await updateRepository(newMetadata, testToken)

		expect(mockOctokit.repos.replaceAllTopics).not.toHaveBeenCalled()
	})

	it('should update all fields when all are different', async () => {
		const currentRepo = {
			description: 'Old description',
			homepage: 'https://old-site.com',
			topics: ['old', 'topics'],
		}

		const newMetadata: RepoMetadata = {
			description: 'New description',
			homepage: 'https://new-site.com',
			topics: ['new', 'topics'],
		}

		mockOctokit.repos.get.mockResolvedValue({ data: currentRepo })
		mockOctokit.repos.update.mockResolvedValue({})
		mockOctokit.repos.replaceAllTopics.mockResolvedValue({})

		await updateRepository(newMetadata, testToken)

		expect(mockOctokit.repos.update).toHaveBeenCalledTimes(2)
		expect(mockOctokit.repos.update).toHaveBeenNthCalledWith(1, {
			description: 'New description',
			owner: 'test-owner',
			repo: 'test-repo',
		})
		expect(mockOctokit.repos.update).toHaveBeenNthCalledWith(2, {
			homepage: 'https://new-site.com',
			owner: 'test-owner',
			repo: 'test-repo',
		})
		expect(mockOctokit.repos.replaceAllTopics).toHaveBeenCalledWith({
			names: ['new', 'topics'],
			owner: 'test-owner',
			repo: 'test-repo',
		})
	})

	it('should handle undefined values correctly', async () => {
		const currentRepo = {
			description: 'Some description',
			homepage: 'https://example.com',
			topics: ['some', 'topics'],
		}

		const newMetadata: RepoMetadata = {
			description: undefined,
			homepage: undefined,
			topics: [],
		}

		mockOctokit.repos.get.mockResolvedValue({ data: currentRepo })
		mockOctokit.repos.update.mockResolvedValue({})
		mockOctokit.repos.replaceAllTopics.mockResolvedValue({})

		await updateRepository(newMetadata, testToken)

		expect(mockOctokit.repos.update).toHaveBeenCalledTimes(2)
		expect(mockOctokit.repos.update).toHaveBeenNthCalledWith(1, {
			description: undefined,
			owner: 'test-owner',
			repo: 'test-repo',
		})
		expect(mockOctokit.repos.update).toHaveBeenNthCalledWith(2, {
			homepage: undefined,
			owner: 'test-owner',
			repo: 'test-repo',
		})
		expect(mockOctokit.repos.replaceAllTopics).toHaveBeenCalledWith({
			names: [],
			owner: 'test-owner',
			repo: 'test-repo',
		})
	})
})
