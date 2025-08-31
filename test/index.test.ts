import * as core from '@actions/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock @actions/core
vi.mock('@actions/core', () => ({
	getInput: vi.fn(),
	setFailed: vi.fn(),
}))

// Mock the metadata and github modules
const mockParseMetadata = vi.fn()
const mockUpdateRepository = vi.fn()

vi.mock('../src/metadata', () => ({
	parseMetadata: mockParseMetadata,
}))

vi.mock('../src/github', () => ({
	updateRepository: mockUpdateRepository,
}))

// Mock console.log to avoid noise in tests
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
	// Mock implementation to silence console output in tests
})

describe('GitHub Action main function', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		consoleLogSpy.mockClear()
	})

	afterEach(() => {
		vi.resetModules()
	})

	it('should run successfully with valid inputs', async () => {
		const mockMetadata = {
			description: 'Test description',
			homepage: 'https://example.com',
			topics: ['test', 'action'],
		}

		vi.mocked(core.getInput).mockReturnValue('test-token')
		mockParseMetadata.mockResolvedValue(mockMetadata)
		// eslint-disable-next-line unicorn/no-useless-undefined
		mockUpdateRepository.mockResolvedValue(undefined)

		// Import and run the main function
		await vi.importActual('../src/index')

		expect(core.getInput).toHaveBeenCalledWith('TOKEN', { required: true })
		expect(mockParseMetadata).toHaveBeenCalled()
		expect(mockUpdateRepository).toHaveBeenCalledWith(mockMetadata, 'test-token')
		expect(consoleLogSpy).toHaveBeenCalledWith(`Found metadata: ${JSON.stringify(mockMetadata)}`)
		expect(consoleLogSpy).toHaveBeenCalledWith('Successfully updated repository metadata')
		expect(core.setFailed).not.toHaveBeenCalled()
	})

	it('should handle parseMetadata error', async () => {
		const error = new Error('Failed to parse metadata')

		vi.mocked(core.getInput).mockReturnValue('test-token')
		mockParseMetadata.mockRejectedValue(error)

		// Import and run the main function
		await vi.importActual('../src/index')

		expect(mockParseMetadata).toHaveBeenCalled()
		expect(mockUpdateRepository).not.toHaveBeenCalled()
		expect(core.setFailed).toHaveBeenCalledWith(
			'Action failed with error: Error: Failed to parse metadata',
		)
	})

	it('should handle updateRepository error', async () => {
		const mockMetadata = {
			description: 'Test description',
			homepage: 'https://example.com',
			topics: ['test'],
		}
		const error = new Error('Failed to update repository')

		vi.mocked(core.getInput).mockReturnValue('test-token')
		mockParseMetadata.mockResolvedValue(mockMetadata)
		mockUpdateRepository.mockRejectedValue(error)

		// Import and run the main function
		await vi.importActual('../src/index')

		expect(mockParseMetadata).toHaveBeenCalled()
		expect(mockUpdateRepository).toHaveBeenCalledWith(mockMetadata, 'test-token')
		expect(core.setFailed).toHaveBeenCalledWith(
			'Action failed with error: Error: Failed to update repository',
		)
	})

	it('should handle missing TOKEN input', async () => {
		vi.mocked(core.getInput).mockImplementation((name) => {
			if (name === 'TOKEN') {
				throw new Error('Input required and not supplied: TOKEN')
			}
			return ''
		})

		// Import and run the main function
		await vi.importActual('../src/index')

		expect(core.setFailed).toHaveBeenCalledWith(
			'Action failed with error: Error: Input required and not supplied: TOKEN',
		)
	})
})
