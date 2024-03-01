import { ActionOctokit } from 'octoflare/action'
import { IssueActionEvent } from '../../../types/IssueActionEvent.js'

export const onIssue = async ({
  event,
  repo,
  owner
}: {
  octokit: ActionOctokit
  event: IssueActionEvent
  repo: string
  owner: string
}) => {
  console.log('Issue Event', {
    repo,
    owner,
    event
  })
}
