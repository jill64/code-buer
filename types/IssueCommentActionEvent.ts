import { IssueComment, IssuesEvent } from 'octoflare/webhook'

export type IssueCommentActionEvent = {
  type: 'issue_comment'
  issue: IssuesEvent['issue']
  comment: IssueComment
  prepared_comment_id: number
}
