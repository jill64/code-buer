import { attempt } from '@jill64/attempt'
import type { Condition } from 'typescanner/dist/types'

export const pickJson = <T>(str: string, guard: Condition<T>) => {
  const response = attempt(() => {
    const json = JSON.parse(str)
    return guard(json) ? json : null
  }, null)

  return response
}
