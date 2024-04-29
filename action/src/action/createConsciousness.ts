import { ActionOctokit } from 'octoflare/action'
import { array, list as isList, scanner, string } from 'typescanner'
import { conversation } from '../buer/conversation.js'
import { giveFileContents } from '../buer/prompts/giveFileContents.js'
import { profile } from '../buer/prompts/profile.js'
import { makeFileTree } from '../util/makeFileTree.js'
import { pickJsonFromMd } from '../util/pickJsonFromMd.js'

export const createConsciousness = async ({
  octokit,
  repo,
  owner
}: {
  octokit: ActionOctokit
  repo: string
  owner: string
}) => {
  console.log('Creating Consciousness', `${owner}/${repo}`)

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
Prepare a high-level project summary that includes the following elements.

\`\`\`
- Features
- Architectures
- Technologies
- Languages
- Libraries
- Frameworks
- Tools
- etc...
\`\`\`

Please observe the following rules when creating it.

\`\`\`
- If you want to know the contents of the file, reply with the path to the file you need in the form of a JSON array.
- Keep requesting the contents of the file until you have all the information you need.
- When replying in the form of a JSON array with the path to the required file, please request the JSON object text in markdown code block format.
- Please do not request the same file more than once.
\`\`\`

Example of a file request:
\`\`\`json
["src/index.js", "README.md"]
\`\`\`

The following is a list of project files.

\`\`\`
${file_list}
\`\`\`
${wip_summary(past)}
Once a summary has been created with sufficient information, output its contents according to the JSON format below.
The summary should be output in the following JSON format with appropriate headings, links, lists, citations, etc. in markdown format.
\`\`\`json
{
  type: 'summary',
  content: '# Project summary described as markdown format'
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
          content: string
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

  const last = result.pop()

  if (last?.role !== 'assistant' || !last?.content) {
    throw new Error('No Result from Conversation')
  }

  const { content } =
    pickJsonFromMd(
      last.content,
      scanner({
        type: isList(['summary']),
        content: string
      })
    ) ?? {}

  if (!content) {
    throw new Error('No Summary')
  }

  await octokit.rest.issues.create({
    owner,
    repo,
    title: 'Consciousness',
    body: content,
    labels: ['dashboard']
  })
}
