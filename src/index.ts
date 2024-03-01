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
    const { ref, repository, before, commits, after, head_commit } = payload

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
          type: 'push',
          commits,
          before,
          after
        } as ActionEvent
      })
    }
  }

  if ('pull_request' in payload && 'number' in payload) {
    // return await respond({
    //   repository: payload.repository,
    //   event: {
    //     type: 'pull_request'
    //   }
    // })
  }

  if ('issue' in payload) {
    const { issue } = payload

    if (issue.user.login !== 'code-buer[bot]') {
      return new Response('Skip Event: Issue not created by buer', {
        status: 200
      })
    }

    if ('comment' in payload && payload.action === 'created') {
      const { comment, repository } = payload

      if (comment.user.login === 'code-buer[bot]') {
        return new Response('Skip Event: Comment not created by buer', {
          status: 200
        })
      }

      const {
        data: { id }
      } = await installation.kit.rest.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: issue.number,
        body: `@${comment.user.login} Thanks for the comment !
Please wait while I process it.`
      })

      return await respond({
        repository: payload.repository,
        event: {
          type: 'issue_comment',
          issue,
          comment,
          prepared_comment_id: id
        } as ActionEvent
      })
    }

    // return await respond({
    //   repository: payload.repository,
    //   event: {
    //     type: 'issue'
    //   }
    // })
  }

  return new Response('Skip Event: No Trigger Event', {
    status: 200
  })
})
