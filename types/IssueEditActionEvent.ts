import { IssuesEditedEvent } from 'octoflare/webhook'

export type IssueEditActionEvent = {
  type: 'issue'
  before: NonNullable<IssuesEditedEvent['changes']['body']>['from']
  after: IssuesEditedEvent['issue']['body']
}
