import { octoflare } from 'octoflare'
import { Repository } from 'octoflare/webhook'
import { ActionEvent } from '../types/ActionEvent.js'

export default octoflare<ActionEvent>(async ({ payload, installation }) => {
  if (!installation) {
    return new Response('Skip Event: No Installation', {
      status: 200
    })
  }

  const respond = async ({
    repository,
    event
  }: {
    repository: Repository
    event: ActionEvent
  }) => {
    await installation.startWorkflow({
      repo: repository.name,
      owner: repository.owner.login,
      data: event
    })

    return new Response('Code Buer Workflow Dispatched', {
      status: 202
    })
  }

  if ('commits' in payload) {
    const { ref, repository, commits, head_commit } = payload

    if (head_commit?.message.startsWith('chore:')) {
      return new Response('Skip Event: Trivial changes by PR', {
        status: 200
      })
    }

    if (commits.every((commit) => commit.author.name.includes('[bot]'))) {
      return new Response('Skip Event: All Commits by Bot', {
        status: 200
      })
    }

    if (ref.replace('refs/heads/', '') === repository.default_branch) {
      return await respond({
        repository,
        event: {
          type: 'push'
        }
      })
    }
  }

  if ('issue' in payload) {
    const { issue } = payload

    if (issue.user.login !== 'code-buer[bot]') {
      return new Response('Skip Event: Issue not created by buer', {
        status: 200
      })
    }

    if (
      'changes' in payload &&
      payload.changes &&
      'body' in payload.changes &&
      payload.changes.body?.from
    ) {
      return await respond({
        repository: payload.repository,
        event: {
          type: 'issue',
          before: payload.changes.body.from,
          after: issue.body
        }
      })
    }
  }

  return new Response('Skip Event: No Trigger Event', {
    status: 200
  })
})
