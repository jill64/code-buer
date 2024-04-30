import { array, list as isList, scanner, string } from 'typescanner'
import { conversation } from '../buer/conversation.js'
import { makeFileTree } from '../util/makeFileTree.js'
import { pickJson } from '../util/pickJson.js'
import { readFile } from 'node:fs/promises'
import { countToken } from '../util/countToken.js'
import { attempt } from '@jill64/attempt'

const giveFileContents = async (path: string) => {
  const str = await readFile(path, 'utf-8')
  const token = attempt(() => countToken(str), Infinity)

  const ext = path.split('.').pop()
  const name = path.split('/').pop()

  if (token > 600000) {
    return `${name}.${ext} is cannot provide information because the file size is too large. 
Please do not request data for this file again.`
  }

  return `
\`\`\`${ext}:${name}
${str}
\`\`\`
`
}

export const generateSanctuaryContents = async () => {
  const file_list = await makeFileTree()

  const intro = `Find the problem with your project based on the following items

- Performance
- Reliability
- Maintenance
- Security
- Documentation

Please observe the following rules when creating it.

- If you want to know the contents of the file, reply with the path to the file you need in the form of a JSON array.
- Keep requesting the contents of the file until you have all the information you need.
- Please do not request the same file more than once.

Example of a file request:
\`\`\`json
{
  "type": "file_request",
  "files": ["src/index.js", "README.md"]
}
\`\`\`

The following is a list of project files.

\`\`\`
${file_list}
\`\`\`

Once a sufficient number of issues have been extracted, output the list in markdown format according to the following JSON format.
\`\`\`json
{
  "type": "summary",
  "content": "# Describe project issues in markdown format"
}
\`\`\`
`

  const result = await conversation(intro, async (reply) => {
    const list = pickJson(
      reply,
      scanner({
        type: isList(['file_request']),
        files: array(string)
      })
    )

    if (!list) {
      const response = pickJson(
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

    const files = await Promise.all(list.files.map(giveFileContents))

    return files.join('\n')
  })

  const last = result.pop()

  if (last?.role !== 'assistant' || !last?.content) {
    throw new Error('No Result from Conversation')
  }

  const { content } =
    pickJson(
      last.content,
      scanner({
        type: isList(['summary']),
        content: string
      })
    ) ?? {}

  if (!content) {
    throw new Error('No Summary')
  }

  return content
}
