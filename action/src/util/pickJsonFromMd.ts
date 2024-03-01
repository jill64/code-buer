import { attempt } from '@jill64/attempt'
import type { Condition } from 'typescanner/dist/types'

export const pickJsonFromMd = <T>(md: string, guard: Condition<T>) => {
  const str = md.match(/```json([\s\S]*?)```/)?.[1]

  const response = attempt(() => {
    const json = JSON.parse(str ? str : md)
    return guard(json) ? json : null
  }, null)

  return response
}
