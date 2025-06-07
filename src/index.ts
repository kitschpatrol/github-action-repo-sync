#!/usr/bin/env node

import * as core from '@actions/core'
import { parseMetadata, type RepoMetadata } from './metadata'
import { updateRepository } from './github'

async function main() {
	try {
		// Get inputs
		const token = core.getInput('TOKEN', { required: true })

		// Find metadata in project config files
		const metadata = await parseMetadata()

		// Update repository metadata if needed
		await updateRepository(metadata, token)
	} catch (error) {
		core.setFailed(`Action failed with error: ${error}`)
	}
}

await main()
