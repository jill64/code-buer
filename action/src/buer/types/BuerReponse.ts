import { request } from '../request.js'

export type BuerResponse = Awaited<ReturnType<typeof request>>
