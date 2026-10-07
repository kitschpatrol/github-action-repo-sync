import { context } from '@actions/github'
import { Octokit } from '@octokit/rest'
import type { RepositoryMetadata } from './metadata'

/**
 * Update repository metadata on GitHub
 */
export async function updateRepository(
	metadata: RepositoryMetadata,
	token: string,
	actionContext: { owner: string; repo: string } = context.repo,
) {
	const octokit = new Octokit({
		auth: token,
	})

	const { owner, repo } = actionContext
	const { data } = await octokit.repos.get({ owner, repo })

	const currentRepositoryMetadata = data as RepositoryMetadata

	// GitHub API sometimes reports these as null...
	currentRepositoryMetadata.description ??= ''
	currentRepositoryMetadata.homepage ??= ''

	const updates: Array<Promise<unknown>> = []

	// Update description
	if (metadata.description !== currentRepositoryMetadata.description) {
		console.log(`\nDescription: ${metadata.description}`)
		console.log(`Updating description for [${owner}/${repo}]`)

		updates.push(
			octokit.repos.update({
				description: metadata.description,
				owner,
				repo,
			}),
		)
	}

	// Update homepage
	// Clear if it's a GitHub repo URL (redundant) or if no homepage is set locally
	const resolvedHomepage =
		metadata.homepage !== undefined &&
		metadata.homepage !== '' &&
		!metadata.homepage.startsWith(`https://github.com/${owner}/${repo}`)
			? metadata.homepage
			: ''

	if (currentRepositoryMetadata.homepage !== resolvedHomepage) {
		console.log(`\nWebsite: ${resolvedHomepage}`)
		console.log(`Updating homepage for [${owner}/${repo}]`)

		updates.push(
			octokit.repos.update({
				homepage: resolvedHomepage,
				owner,
				repo,
			}),
		)
	}

	// Update topics

	if (
		metadata.topics.toSorted().join(',') !== currentRepositoryMetadata.topics.toSorted().join(',')
	) {
		console.log(`\nTopics: ${JSON.stringify(metadata.topics)}`)
		console.log(`Updating topics for [${owner}/${repo}]`)

		updates.push(
			octokit.repos.replaceAllTopics({
				names: metadata.topics,
				owner,
				repo,
			}),
		)
	}

	// Execute all updates in parallel
	await Promise.allSettled(updates)
}
