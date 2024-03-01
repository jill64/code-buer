import { ActionOctokit } from 'octoflare/action'
import { PushActionEvent } from '../../../types/PushActionEvent.js'
import { createConsciousness } from '../action/createConsciousness.js'
import { updateConsciousness } from '../action/updateConsciousness.js'
import { listMyIssues } from '../rest/listMyIssues.js'

export const onPush = async ({
  octokit,
  event,
  repo,
  owner
}: {
  octokit: ActionOctokit
  event: PushActionEvent
  repo: string
  owner: string
}) => {
  const list = await listMyIssues({ octokit, repo, owner })

  const consciousness = list.find((issue) => issue.title === 'Consciousness')

  if (!consciousness) {
    await createConsciousness({ octokit, repo, owner })
    return
  }

  await updateConsciousness({ octokit, event, repo, owner, consciousness })
}
