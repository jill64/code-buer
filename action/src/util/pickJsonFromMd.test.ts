import { scanner, string } from 'typescanner'
import { expect, test } from 'vitest'
import { pickJsonFromMd } from './pickJsonFromMd.js'

test('pickJsonFromMd', () => {
  const md = `
# Title

## Subtitle

\`\`\`json
{
  "name": "value"
}
\`\`\`
`

  expect(
    pickJsonFromMd(
      md,
      scanner({
        name: string
      })
    )
  ).toEqual({
    name: 'value'
  })
})
