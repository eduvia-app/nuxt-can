import { diffLines } from 'diff'
import pc from 'picocolors'

import type { DiffPayload } from './types'

export function reportTemplateDiff({ before, after, id }: DiffPayload): void {
  const diffs = diffLines(before, after)
  const body = diffs
    .map((part) => {
      if (part.added) return pc.green(part.value)
      if (part.removed) return pc.red(part.value)
      return part.value
    })
    .join('')

  console.log(pc.bold(`\n===== DIFF ${id} =====`))
  console.log(body)
  console.log(pc.bold('============================\n'))
}
