import { ActionOctokit } from 'octoflare/action'
import { PullRequestActionEvent } from '../../../types/PullRequestActionEvent.js'

export const onPullRequest = async ({
  event,
  repo,
  owner
}: {
  octokit: ActionOctokit
  event: PullRequestActionEvent
  repo: string
  owner: string
}) => {
  console.log('PR Event', {
    repo,
    owner,
    event
  })
}
