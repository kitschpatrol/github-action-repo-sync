import { context } from '@actions/github'
import { Octokit } from '@octokit/rest'
import { RepoMetadata } from './metadata'

export async function updateRepository(metadata: RepoMetadata, token: string) {
	const octokit = new Octokit({
		auth: token,
	})

	const { owner, repo } = context.repo
	const { data } = await octokit.repos.get({ owner, repo })

	const currentRepoMetadata = data as RepoMetadata

	const updates: Promise<any>[] = []

	// Update description
	if (
		metadata.description !== undefined &&
		metadata.description !== currentRepoMetadata.description
	) {
		console.log(`\nDescription: ${metadata.description}`)
		console.log(`Updating description for [${owner}/${repo}]`)

		updates.push(
			octokit.repos.update({
				owner,
				repo,
				description: metadata.description,
			}),
		)
	}

	// Update homepage
	// Skip if it's just a GitHub repo URL (likely redundant)
	if (
		metadata.homepage !== undefined &&
		currentRepoMetadata.homepage !== metadata.homepage &&
		!metadata.homepage.startsWith(`https://github.com/${owner}/${repo}`)
	) {
		console.log(`\nWebsite: ${metadata.homepage}`)
		console.log(`Updating homepage for [${owner}/${repo}]`)

		updates.push(
			octokit.repos.update({
				owner,
				repo,
				homepage: metadata.homepage,
			}),
		)
	}

	// Update topics
	if (
		metadata.topics !== undefined &&
		Array.isArray(metadata.topics) &&
		metadata.topics.length > 0 &&
		metadata.topics.sort().join(',') !== currentRepoMetadata.topics?.sort().join(',')
	) {
		console.log(`\nTopics: ${JSON.stringify(metadata.topics)}`)
		console.log(`Updating topics for [${owner}/${repo}]`)

		updates.push(
			octokit.repos.replaceAllTopics({
				owner,
				repo,
				names: metadata.topics,
			}),
		)
	}

	// Execute all updates in parallel
	await Promise.allSettled(updates)
}
