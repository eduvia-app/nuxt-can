import {
  type RootNode,
  type TemplateChildNode,
  type ElementNode,
  type DirectiveNode,
  NodeTypes,
} from '@vue/compiler-dom'

import type { Patch } from './types'
import { isTemplateChild } from './nodes'
import { raiseDirectiveError } from './errors'

interface WalkerContext {
  templateStart: number
  patches: Patch[]
  filename?: string
}

interface PendingCan {
  expression: string
}

export function collectCanPatches(ast: RootNode, templateStart: number, filename?: string): Patch[] {
  const ctx: WalkerContext = {
    templateStart,
    patches: [],
    filename,
  }

  walkChildren(ast.children, ctx)

  return ctx.patches
}

function walkChildren(children: TemplateChildNode[], ctx: WalkerContext): void {
  let pendingCan: PendingCan | null = null

  for (const child of children) {
    if (!isTemplateChild(child)) {
      pendingCan = null
      continue
    }

    if (child.type === NodeTypes.TEXT) {
      if (child.content.trim().length > 0) {
        pendingCan = null
      }
      continue
    }

    if (child.type === NodeTypes.COMMENT) {
      continue
    }

    if (child.type !== NodeTypes.ELEMENT) {
      pendingCan = null
      continue
    }

    const nextPending = handleElement(child as ElementNode, ctx, pendingCan)
    pendingCan = nextPending

    if (Array.isArray(child.children) && child.children.length > 0) {
      walkChildren(child.children, ctx)
    }
  }
}

function handleElement(element: ElementNode, ctx: WalkerContext, pendingCan: PendingCan | null): PendingCan | null {
  let canDirective: DirectiveNode | null = null
  let cannotDirective: DirectiveNode | null = null
  let ifDirective: DirectiveNode | null = null

  for (const prop of element.props) {
    if (prop.type !== NodeTypes.DIRECTIVE) continue
    if (prop.name === 'can') canDirective = prop
    if (prop.name === 'cannot') cannotDirective = prop
    if (prop.name === 'if') ifDirective = prop
  }

  if (canDirective && cannotDirective) {
    raiseDirectiveError(ctx, cannotDirective.loc, '`v-can` and `v-cannot` cannot be used on the same element.')
  }

  if (cannotDirective) {
    transformCannotDirective({
      directive: cannotDirective,
      ctx,
      pendingCan,
      ifDirective,
    })

    return null
  }

  if (canDirective) {
    const expression = transformCanDirective({
      canDirective,
      ifDirective,
      ctx,
    })

    return {
      expression,
    }
  }

  return null
}

function transformCanDirective(params: {
  canDirective: DirectiveNode
  ifDirective: DirectiveNode | null
  ctx: WalkerContext
}): string {
  const { canDirective, ifDirective, ctx } = params

  if (canDirective.exp?.type !== NodeTypes.SIMPLE_EXPRESSION) {
    raiseDirectiveError(ctx, canDirective.loc, '`v-can` expects a static expression (for example `v-can="can.x.y"`).')
  }

  const canExpression = canDirective.exp.content?.trim()
  if (!canExpression) {
    raiseDirectiveError(ctx, canDirective.loc, '`v-can` requires a valid permission expression such as `can.employee.view`.')
  }

  if (ifDirective && ifDirective.exp?.type === NodeTypes.SIMPLE_EXPRESSION) {
    const ifExpression = (ifDirective.exp.content || 'true').trim() || 'true'

    ctx.patches.push({
      start: ctx.templateStart + ifDirective.loc.start.offset,
      end: ctx.templateStart + ifDirective.loc.end.offset,
      text: `v-if="(${canExpression}) && (${ifExpression})"`,
    })

    ctx.patches.push({
      start: ctx.templateStart + canDirective.loc.start.offset,
      end: ctx.templateStart + canDirective.loc.end.offset,
      text: '',
    })
  }
  else {
    ctx.patches.push({
      start: ctx.templateStart + canDirective.loc.start.offset,
      end: ctx.templateStart + canDirective.loc.end.offset,
      text: `v-if="${canExpression}"`,
    })
  }

  return canExpression
}

function transformCannotDirective(params: {
  directive: DirectiveNode
  pendingCan: PendingCan | null
  ifDirective: DirectiveNode | null
  ctx: WalkerContext
}): void {
  const { directive, pendingCan, ctx, ifDirective } = params

  if (directive.exp) {
    raiseDirectiveError(ctx, directive.loc, '`v-cannot` must not carry an expression (use `v-cannot` by itself).')
  }

  if (directive.arg) {
    raiseDirectiveError(ctx, directive.loc, '`v-cannot` does not accept arguments.')
  }

  if (directive.modifiers.length) {
    raiseDirectiveError(ctx, directive.loc, '`v-cannot` does not accept modifiers.')
  }

  if (ifDirective) {
    raiseDirectiveError(ctx, directive.loc, '`v-cannot` cannot be combined with `v-if`; remove the extra condition.')
  }

  if (!pendingCan) {
    raiseDirectiveError(ctx, directive.loc, '`v-cannot` must immediately follow its `v-can`, and there can be only one `v-cannot` per `v-can` block.')
  }

  ctx.patches.push({
    start: ctx.templateStart + directive.loc.start.offset,
    end: ctx.templateStart + directive.loc.end.offset,
    text: `v-if="!(${pendingCan.expression})"`,
  })
}
