import type { request } from '../request.js'

export type BuerResponse = Awaited<ReturnType<typeof request>>
