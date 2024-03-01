import { ActionOctokit } from 'octoflare/action'
import { array, scanner, string } from 'typescanner'
import { conversation } from '../buer/conversation.js'
import { giveFileContents } from '../buer/prompts/giveFileContents.js'
import { profile } from '../buer/prompts/profile.js'
import { Consciousness } from '../types/Consciousness.js'
import { makeFileTree } from '../util/makeFileTree.js'
import { pickJsonFromMd } from '../util/pickJsonFromMd.js'

export const interactConsciousness = async ({
  octokit,
  repo,
  owner,
  consciousness,
  prepared_comment_id
}: {
  octokit: ActionOctokit
  repo: string
  owner: string
  consciousness: Consciousness
  prepared_comment_id: number
}) => {
  console.log('Interacting Consciousness', `${owner}/${repo}`)

  const { data: comments } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: consciousness.number
  })

  if (comments.length === 0) {
    console.log('No Comments')
    return
  }

  const file_list = await makeFileTree()

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
First, here is an overview of the project you previously created

\`\`\`md
${consciousness.body}
\`\`\`

Next, the conversation with the user is shown below.
For comments not related to the project, please ignore them.

\`\`\`json
${JSON.stringify(
  comments.map(({ created_at, user, body }) => ({
    created_at,
    user: user?.login,
    body
  }))
)}
\`\`\`

In addition, please answer according to the following rules.

====================
- When information about a file is needed, instead of generating a comment, reply with the path to the file you need in the form of a JSON array.

\`\`\`json
[
  "path/to/file"
]
\`\`\`

- Keep requesting the contents of the file until you have all the information you need.
- When replying in the form of a JSON array with the path to the required file, please request the JSON object text in markdown code block format.
- Please do not request the same file more than once.
====================

The following is a list of project files.

\`\`\`
${file_list}
\`\`\`
${wip_summary(past)}

When ready, return the response in the following JSON format.
DO NOT REPLY IN PLAIN TEXT.

\`\`\`json
{
  "comment": "Do not include a summary in this field, but create a response to the user in 140 characters or less.",
  "updated_summary": "A summary in markdown format, modified according to the comments."
}
\`\`\`
`

  const result = await conversation(intro, async (reply, { max_token }) => {
    const list = pickJsonFromMd(reply, array(string))

    if (!list) {
      const response = pickJsonFromMd(
        reply,
        scanner({
          comment: string,
          updated_summary: string
        })
      )

      if (!response) {
        throw new Error('No Summary')
      }

      return
    }

    const response = list.map((path) => giveFileContents(path, max_token))

    return await Promise.all(response)
  })

  const last = result[result.length - 1]

  if (last?.role !== 'assistant' || !last?.content) {
    throw new Error('No Result from Conversation')
  }

  const response = pickJsonFromMd(
    last.content,
    scanner({
      comment: string,
      updated_summary: string
    })
  )

  if (!response) {
    throw new Error('No Summary')
  }

  await octokit.rest.issues.updateComment({
    owner,
    repo,
    comment_id: prepared_comment_id,
    body: response.comment
  })

  await octokit.rest.issues.update({
    owner,
    repo,
    issue_number: consciousness.number,
    body: response.updated_summary
  })
}
