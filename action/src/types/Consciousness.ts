import { ActionOctokit } from 'octoflare/action'

export type Consciousness = Pick<
  Awaited<
    ReturnType<ActionOctokit['rest']['issues']['listForRepo']>
  >['data'][number],
  'number' | 'body'
>
