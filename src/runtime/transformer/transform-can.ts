import { parse as parseSFC } from '@vue/compiler-sfc'
import { parse as parseTemplate } from '@vue/compiler-dom'

import { collectCanPatches } from './patches'
import { applyPatches } from './patcher'
import { reportTemplateDiff } from './reporter'

interface TransformInput {
  code: string
  id: string
  reporter?: boolean
}

export function transformCan({ code, id, reporter }: TransformInput) {
  if (!id.endsWith('.vue')) return null

  const sfc = parseSFC(code)
  const tpl = sfc.descriptor.template
  if (!tpl) return null

  const templateStart = tpl.loc.start.offset
  const templateEnd = tpl.loc.end.offset
  const before = code.slice(templateStart, templateEnd)

  if (!before.includes('v-can') && !before.includes('v-cannot'))
    return null

  const ast = parseTemplate(before, { comments: true })
  const patches = collectCanPatches(ast, templateStart, id)
  if (!patches.length) return null

  const nextCode = applyPatches(code, patches)

  if (reporter)
    reportTemplateDiff({
      before: code,
      after: nextCode,
      id,
    })

  return {
    code: nextCode,
    map: {
      version: 3,
      sources: [id],
      names: [],
      mappings: '',
      sourcesContent: [nextCode],
    },
  }
}
