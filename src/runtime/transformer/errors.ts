import type { SourceLocation } from '@vue/compiler-dom'

export interface ErrorContext {
  filename?: string
}

export function raiseDirectiveError(ctx: ErrorContext, loc: SourceLocation, message: string): never {
  const cwd = process.cwd()
  const filename = ctx.filename
    ? filenameRelativeToCwd(ctx.filename, cwd)
    : '<template>'
  const position = `${filename}:${loc.start.line}:${loc.start.column}`
  const error = new Error(`[nuxt-can] ${message} (${position})`)
  error.name = 'NuxtCanError'
  const stackLine = `    at ${position}`
  if (error.stack) {
    const [head, ...rest] = error.stack.split('\n')
    error.stack = [head, stackLine, ...rest.slice(1)].join('\n')
  }
  else {
    error.stack = `${error.name}: ${error.message}\n${stackLine}`
  }
  throw error
}

function filenameRelativeToCwd(filename: string, cwd: string): string {
  return filename.startsWith(cwd)
    ? filename.slice(cwd.length).replace(/^\//, '')
    : filename
}
