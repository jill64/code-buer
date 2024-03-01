import { ActionOctokit } from 'octoflare/action'
import { IssueCommentActionEvent } from '../../../types/IssueCommentActionEvent.js'
import { interactConsciousness } from '../action/interactConsciousness.js'

export const onIssueComment = async ({
  octokit,
  event: { issue, prepared_comment_id },
  repo,
  owner
}: {
  octokit: ActionOctokit
  event: IssueCommentActionEvent
  repo: string
  owner: string
}) => {
  if (issue.title === 'Consciousness') {
    await interactConsciousness({
      octokit,
      consciousness: issue,
      repo,
      owner,
      prepared_comment_id
    })
    return
  }
}
