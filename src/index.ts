#!/usr/bin/env node

import * as core from '@actions/core'
import { updateRepository } from './github'
import { parseMetadata } from './metadata'

async function main() {
	try {
		// Get inputs
		const token = core.getInput('TOKEN', { required: true })

		// Find metadata in project config files
		const metadata = await parseMetadata()

		console.log(`Found metadata: ${JSON.stringify(metadata)}`)

		// Update repository metadata if needed
		await updateRepository(metadata, token)

		console.log(`Successfully updated repository metadata`)
	} catch (error) {
		core.setFailed(`Action failed with error: ${String(error)}`)
	}
}

await main()
