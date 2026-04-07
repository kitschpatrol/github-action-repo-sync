import * as core from '@actions/core'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setGrammarDirectory } from 'metascope'
import { updateRepository } from './github'
import { parseMetadata } from './metadata'

// Point metascope at the WASM grammars bundled alongside this script
setGrammarDirectory(join(fileURLToPath(new URL('.', import.meta.url)), 'grammars'))

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
