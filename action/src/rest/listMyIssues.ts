import { ActionOctokit } from 'octoflare/action'

export const listMyIssues = async ({
  octokit,
  repo,
  owner
}: {
  octokit: ActionOctokit
  repo: string
  owner: string
}) => {
  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    creator: 'code-buer[bot]'
  })

  console.log('List My Issues', data)

  return data
}
