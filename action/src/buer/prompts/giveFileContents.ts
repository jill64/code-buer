import { readFile } from 'fs/promises'
import { countToken } from '../../util/countToken.js'

export const giveFileContents = async (path: string, max_token: number) => {
  const str = await readFile(path, 'utf-8')
  const token = countToken(str)

  const ext = path.split('.').pop()
  const name = path.split('/').pop()

  if (token > max_token) {
    return `${name} cannot provide information because the file size is too large. 
Please do not request data for this file again.`
  }

  return `
\`\`\`${ext}:${name}
${str}
\`\`\`
`
}
