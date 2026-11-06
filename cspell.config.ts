import { cspellConfig } from '@kitschpatrol/cspell-config'

export default cspellConfig({
	ignorePaths: ['dist/**/*', '**/changelog.md'],
	words: ['chagent', 'coderepository'],
})
