import { ActionOctokit } from 'octoflare/action'
import { PushActionEvent } from '../../../types/PushActionEvent.js'
import { generateSanctuaryContents } from '../action/generateSanctuaryContents.js'

export const onPush = async ({
  octokit,
  repo,
  owner
}: {
  octokit: ActionOctokit
  event: PushActionEvent
  repo: string
  owner: string
}) => {
  const { data: list } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    creator: 'code-buer[bot]'
  })

  const body = await generateSanctuaryContents()

  const sanctuary = list.find((issue) => issue.title === 'Sanctuary')

  if (!sanctuary) {
    await octokit.rest.issues.create({
      owner,
      repo,
      title: 'Sanctuary',
      body,
      labels: ['dashboard']
    })
    return
  }

  await octokit.rest.issues.update({
    owner,
    repo,
    issue_number: sanctuary.number,
    body
  })
}
