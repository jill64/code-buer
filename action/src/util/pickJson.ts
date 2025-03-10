import { attempt } from '@jill64/attempt'

type Condition<T> = (value: unknown) => value is T

export const pickJson = <T>(str: string, guard: Condition<T>) => {
  const response = attempt(() => {
    const json = JSON.parse(str)
    return guard(json) ? json : null
  }, null)

  return response
}
