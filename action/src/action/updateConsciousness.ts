import exec from '@actions/exec'
import { ActionOctokit } from 'octoflare/action'
import { array, list as isList, scanner, string } from 'typescanner'
import { PushActionEvent } from '../../../types/PushActionEvent.js'
import { conversation } from '../buer/conversation.js'
import { profile } from '../buer/prompts/profile.js'
import { Consciousness } from '../types/Consciousness.js'
import { countToken } from '../util/countToken.js'
import { pickJsonFromMd } from '../util/pickJsonFromMd.js'

export const updateConsciousness = async ({
  octokit,
  consciousness,
  event,
  owner,
  repo
}: {
  octokit: ActionOctokit
  event: PushActionEvent
  owner: string
  repo: string
  consciousness: Consciousness
}) => {
  console.log('Updating Consciousness', JSON.stringify(consciousness, null, 2))

  const wip_summary = (past?: string) =>
    past
      ? `
The following is a list of files and their contents that have already been verified by you.

\`\`\`
${past}
\`\`\`
`
      : ''

  const intro = (past?: string) => `${profile}
You will now make changes to the project summary document based on the changes in the file.
A summary of the projects you have previously generated is as follows

\`\`\`md
${consciousness.body}
\`\`\`

Please observe the following rules when creating it.

\`\`\`
- If you want to know the changes of the file, reply with the path to the file you need in the form of a JSON array.
- Keep requesting the contents of the file until you have all the information you need.
- When replying in the form of a JSON array with the path to the required file, please request the JSON object text in markdown code block format.
- Please do not request the same file more than once.
\`\`\`

Example of a file request:
\`\`\`json
["src/index.js", "README.md"]
\`\`\`

The commits are as follows

\`\`\`
${JSON.stringify(
  event.commits.map(({ message, added, modified, removed }) => ({
    message,
    added,
    modified,
    removed
  }))
)}
\`\`\`
${wip_summary(past)}
Once the summary has been updated, output its contents according to the following JSON format. 
The summary should be output in the following JSON format.
\`\`\`json
{
  type: "summary",
  updated_summary: '# Updated project summary described as markdown format'
}
\`\`\`
`

  const result = await conversation(intro, async (reply, { max_token }) => {
    const list = pickJsonFromMd(reply, array(string))

    if (!list) {
      const response = pickJsonFromMd(
        reply,
        scanner({
          type: isList(['summary']),
          updated_summary: string
        })
      )

      if (!response) {
        throw new Error('No Summary')
      }

      return
    }

    const response = list.map(async (path) => {
      const { stdout: str } = await exec.getExecOutput('git diff HEAD^ --', [
        path
      ])

      const token = countToken(str)
      const name = path.split('/').pop()

      if (token > max_token) {
        return `${name} cannot provide information because the file size is too large. 
Please do not request data for this file again.`
      }

      return str
    })

    return await Promise.all(response)
  })

  const last = result.pop()

  if (last?.role !== 'assistant' || !last?.content) {
    throw new Error('No Result from Conversation')
  }

  const { updated_summary } =
    pickJsonFromMd(
      last.content,
      scanner({
        type: isList(['summary']),
        updated_summary: string
      })
    ) ?? {}

  if (!updated_summary) {
    throw new Error('No Summary')
  }

  await octokit.rest.issues.update({
    owner,
    repo,
    issue_number: consciousness.number,
    body: updated_summary
  })

  const { data: allComments } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: consciousness.number
  })

  const deleteCommentsResult = allComments.map(({ id }) =>
    octokit.rest.issues.deleteComment({
      owner,
      repo,
      comment_id: id
    })
  )

  await Promise.all(deleteCommentsResult)
}
