import { ActionOctokit } from 'octoflare/action'

export type Sanctuary = Pick<
  Awaited<
    ReturnType<ActionOctokit['rest']['issues']['listForRepo']>
  >['data'][number],
  'number' | 'body'
>
