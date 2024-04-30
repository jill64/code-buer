import { ActionOctokit } from 'octoflare/action'
import { IssueEditActionEvent } from '../../../types/IssueEditActionEvent.js'

export const onIssue = async ({
  event,
  repo,
  owner
}: {
  octokit: ActionOctokit
  event: IssueEditActionEvent
  repo: string
  owner: string
}) => {
  console.log('Issue Edit Event', {
    repo,
    owner,
    event
  })
}
