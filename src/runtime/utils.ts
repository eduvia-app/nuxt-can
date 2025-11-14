import type { SourceLocation, TransformContext } from '@vue/compiler-dom'

export const reportError = (context: TransformContext, message: string, loc: SourceLocation) => {
  context.onError({
    name: 'CanDirectiveError',
    code: 0,
    loc: loc,
    message: `[nuxt-can] ${message}`,
  })
}
