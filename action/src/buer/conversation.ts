import { retryAsync } from 'ts-retry'
import { countToken } from '../util/countToken.js'
import { PAUSE_TOKEN, pause } from './prompts/pause.js'
import { request } from './request.js'
import { BuerRequestMessages } from './types/BuerRequestMessages.js'

const normalize = (
  content: string | BuerRequestMessages,
  role: 'user' | 'assistant' = 'user'
): BuerRequestMessages =>
  typeof content === 'string' ? [{ role, content }] : content

export const conversation = async (
  intro: (past?: string) => string | BuerRequestMessages,
  iterate: (
    reply: string,
    metadata: {
      max_token: number
    }
  ) => Promise<string[] | void>,
  options?: {
    max_turns?: number
  }
) => {
  const { max_turns = 10 } = options ?? {}

  const greeting = intro()

  let messages = normalize(greeting)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const _ of new Array(max_turns).keys()) {
    const { remain_tokens, next } = await retryAsync(
      async () => {
        const response = await request(messages)

        if (response.finish_reason === 'length') {
          throw new Error('Conversation Length Exceeded')
        }

        const remain_tokens = response.remain_tokens - PAUSE_TOKEN

        if (remain_tokens < 0) {
          throw new Error('Conversation Token Limit Exceeded')
        }

        if (!response.message.content) {
          throw new Error('No Reply Content')
        }

        const next = await iterate(response.message.content, {
          max_token: response.max_token
        })

        messages.push(response.message)

        return {
          response,
          next,
          remain_tokens
        }
      },
      {
        maxTry: 3,
        delay: 10000,
        onError(err) {
          console.log('Error on sending messages', err.message)
          console.log('Retrying... after 10 seconds')
        }
      }
    )

    // End of conversation
    if (!next?.length) {
      console.log('End of Conversation')
      return messages
    }

    const { message, index } = next.reduce(
      (prev, curr, index) => {
        const message = `${prev.message}\n${curr}`
        return remain_tokens < countToken(message)
          ? prev
          : {
              message,
              index: index + 1
            }
      },
      {
        message: '',
        index: 0
      }
    )

    // Success to send all messages
    if (index === next.length) {
      messages.push({ role: 'user', content: message })
      continue
    }

    // Inheriting
    const sendable_messages = next.slice(0, index)

    messages.push({
      role: 'user',
      content: `${sendable_messages.join('\n')}\n\n${pause}`
    })

    const resumed = await retryAsync(
      async () => {
        const wip_summary = await request(messages)

        if (wip_summary.finish_reason === 'length') {
          throw new Error('Conversation Length Exceeded')
        }

        if (!wip_summary.message.content) {
          throw new Error('No Summary Content')
        }

        return intro(wip_summary.message.content ?? '')
      },
      {
        maxTry: 3,
        delay: 120000,
        onError(err) {
          console.log('Error on sending wip_summary messages', err.message)
          console.log('Retrying... after 2 minutes')
        }
      }
    )

    messages = normalize(resumed)
  }

  throw new Error('Conversation Turn Limit Exceeded')
}
