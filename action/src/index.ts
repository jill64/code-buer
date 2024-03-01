import { action } from 'octoflare/action'
import { ActionEvent } from '../../types/ActionEvent.js'
import { onIssue } from './listener/onIssue.js'
import { onIssueComment } from './listener/onIssueComment.js'
import { onPullRequest } from './listener/onPullRequest.js'
import { onPush } from './listener/onPush.js'

action<ActionEvent>(
  async ({ payload: { repo, owner, data: event }, octokit }) => {
    if (event.type === 'push') {
      await onPush({ octokit, event, repo, owner })
      return
    }

    if (event.type === 'pull_request') {
      await onPullRequest({ octokit, event, repo, owner })
      return
    }

    if (event.type === 'issue') {
      await onIssue({ octokit, event, repo, owner })
      return
    }

    if (event.type === 'issue_comment') {
      await onIssueComment({ octokit, event, repo, owner })
      return
    }

    console.log('No Triggered Event')
  }
)
