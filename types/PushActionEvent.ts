import { PushEvent } from 'octoflare/webhook'

export type PushActionEvent = {
  type: 'push'
  before: PushEvent['before']
  after: PushEvent['after']
  commits: PushEvent['commits']
}
