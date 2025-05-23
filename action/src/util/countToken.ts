import { getEncoding, getEncodingNameForModel } from 'js-tiktoken'
import { ChatCompletionContentPart } from 'openai/resources/index.mjs'

const enc = getEncoding(getEncodingNameForModel('gpt-4'))

export const countToken = (messages: string | ChatCompletionContentPart[]) =>
  enc.encode(
    typeof messages === 'string'
      ? messages
      : messages
          .map((m) =>
            m.type === 'text'
              ? m.text
              : m.type === 'image_url'
                ? m.image_url
                : m.input_audio
          )
          .join('\n')
  ).length
