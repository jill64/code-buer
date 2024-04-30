import { request } from './request.js'
import { BuerRequestMessages } from './types/BuerRequestMessages.js'

const normalize = (
  content: string | BuerRequestMessages,
  role: 'user' | 'assistant' = 'user'
): BuerRequestMessages =>
  typeof content === 'string' ? [{ role, content }] : content

export const conversation = async (
  intro: string | BuerRequestMessages,
  iterate: (reply: string) => Promise<string | void>,
  options?: {
    max_turns?: number
  }
) => {
  const { max_turns = 10 } = options ?? {}

  const messages = normalize(intro)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const _ of new Array(max_turns).keys()) {
    const response = await request(messages)

    if (response.finish_reason === 'length') {
      throw new Error('Conversation Length Exceeded')
    }

    if (!response.message.content) {
      throw new Error('No Reply Content')
    }

    const next = await iterate(response.message.content)

    messages.push(response.message)

    if (!next) {
      console.log('End of Conversation')
      return messages
    }

    messages.push({ role: 'user', content: next })
  }

  throw new Error('Conversation Turn Limit Exceeded')
}
