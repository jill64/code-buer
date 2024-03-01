import exec from '@actions/exec'
import { minify } from 'path-minifier'

export const makeFileTree = async () => {
  const { stdout: file_list } = await exec.getExecOutput('git ls-files')
  return minify(file_list.split('\n'))
}
