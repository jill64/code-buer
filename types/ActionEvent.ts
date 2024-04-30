import { OctoflarePayloadData } from 'octoflare'
import { IssueEditActionEvent } from './IssueEditActionEvent.js'
import { PushActionEvent } from './PushActionEvent.js'

export type ActionEvent = (PushActionEvent | IssueEditActionEvent) &
  OctoflarePayloadData
