import 'dotenv/config'
import OpenAI from 'openai'
import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions.mjs'
import { countToken } from '../util/countToken.js'
import { BuerRequestMessages } from './types/BuerRequestMessages.js'

const maxTokenByModel = (model: string) =>
  'gpt-4-1106-preview' === model
    ? 128000
    : ['gpt-4', 'gpt-4-0613'].includes(model)
      ? 8192
      : 4096

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export const request = async (
  messages: BuerRequestMessages,
  options?: Partial<Omit<ChatCompletionCreateParamsBase, 'stream'>>
) => {
  console.log(messages)

  const {
    choices: [{ message, finish_reason }],
    usage,
    model
  } = await openai.chat.completions.create({
    messages,
    model: 'gpt-4-1106-preview',
    temperature: 0.2,
    response_format: {
      type: 'json_object'
    },
    ...options
  })

  console.log(message, finish_reason, usage, model)

  const used_tokens =
    usage?.total_tokens ??
    messages.reduce((prev, curr) => prev + countToken(curr.content ?? ''), 0) +
      countToken(message.content ?? '')

  const max_token = maxTokenByModel(model)
  const remain_tokens = max_token - used_tokens

  return {
    message,
    finish_reason,
    remain_tokens,
    max_token
  }
}
