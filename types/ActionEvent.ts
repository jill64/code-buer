import { OctoflarePayloadData } from 'octoflare'
import { IssueActionEvent } from './IssueActionEvent.js'
import { IssueCommentActionEvent } from './IssueCommentActionEvent.js'
import { PullRequestActionEvent } from './PullRequestActionEvent.js'
import { PushActionEvent } from './PushActionEvent.js'

export type ActionEvent = (
  | PushActionEvent
  | PullRequestActionEvent
  | IssueActionEvent
  | IssueCommentActionEvent
) &
  OctoflarePayloadData
