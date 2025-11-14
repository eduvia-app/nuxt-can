import {
  type RootNode,
  type TemplateChildNode,
  type ElementNode,
  type DirectiveNode,
  type SourceLocation,
  NodeTypes,
} from '@vue/compiler-dom'

import type { Patch } from './types'
import { isTemplateChild } from './nodes'
import { raiseDirectiveError } from './errors'

interface WalkerContext {
  templateStart: number
  patches: Patch[]
  filename?: string
  directiveCache: WeakMap<ElementNode, DirectiveSet>
  inheritedCans: WeakMap<ElementNode, string[]>
}

interface PendingCan {
  expression: string
}

interface DirectiveSet {
  canDirective: DirectiveNode | null
  cannotDirective: DirectiveNode | null
  ifDirective: DirectiveNode | null
  elseDirective: DirectiveNode | null
  elseIfDirective: DirectiveNode | null
}

type BranchKind = 'if' | 'else-if' | 'else' | 'plain'

type DirectiveWithSegments = DirectiveNode & { [CAN_SEGMENTS_SYMBOL]?: string[] }

const CAN_SEGMENTS_SYMBOL: unique symbol = Symbol('nuxt-can:segments')
const CAN_IDENTIFIER = new Set(['can', '$can'])
const SEGMENT_PATTERN = /^[\w-]+$/u

export function collectCanPatches(ast: RootNode, templateStart: number, filename?: string): Patch[] {
  const ctx: WalkerContext = {
    templateStart,
    patches: [],
    filename,
    directiveCache: new WeakMap(),
    inheritedCans: new WeakMap(),
  }

  walkChildren(ast.children, ctx)

  return ctx.patches
}

function walkChildren(children: TemplateChildNode[], ctx: WalkerContext): void {
  enforceConditionalChains(children, ctx)

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
  const directives = getDirectiveSet(element, ctx)
  const { canDirective, cannotDirective, ifDirective, elseDirective, elseIfDirective } = directives
  const inheritedSegments = ctx.inheritedCans.get(element) ?? null

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
      ctx,
      branch: determineBranchKind(directives),
      conditionDirective: elseIfDirective ?? ifDirective,
      elseDirective,
    })

    return { expression }
  }

  if (inheritedSegments) {
    const expression = applyInheritedCanGuard({
      segments: inheritedSegments,
      ctx,
      branch: determineBranchKind(directives),
      conditionDirective: elseIfDirective ?? ifDirective,
      elseDirective,
      loc: element.loc,
    })

    return { expression }
  }

  return null
}

function transformCanDirective(params: {
  canDirective: DirectiveNode
  ctx: WalkerContext
  branch: BranchKind
  conditionDirective: DirectiveNode | null
  elseDirective: DirectiveNode | null
}): string {
  const { canDirective, ctx, branch, conditionDirective, elseDirective } = params

  if (canDirective.exp && canDirective.exp.type !== NodeTypes.SIMPLE_EXPRESSION) {
    raiseDirectiveError(ctx, canDirective.loc, '`v-can` expects a static expression (for example `v-can="can.x.y"`).')
  }

  if (canDirective.arg) {
    raiseDirectiveError(ctx, canDirective.loc, '`v-can` does not accept arguments.')
  }

  if (canDirective.modifiers.length) {
    raiseDirectiveError(ctx, canDirective.loc, '`v-can` does not accept modifiers.')
  }

  const expressionContent = canDirective.exp?.content?.trim()
  if (!expressionContent) {
    raiseDirectiveError(ctx, canDirective.loc, '`v-can` requires a valid permission expression such as `can.employee.view`.')
  }

  const pathSegments = getOrParseCanSegments(canDirective, expressionContent, ctx)
  const canInvocation = buildCanInvocation(pathSegments)

  if (branch === 'plain') {
    ctx.patches.push({
      start: ctx.templateStart + canDirective.loc.start.offset,
      end: ctx.templateStart + canDirective.loc.end.offset,
      text: `v-if="${canInvocation}"`,
    })

    return canInvocation
  }

  mergeGuardIntoConditional({
    branch,
    conditionDirective,
    elseDirective,
    canInvocation,
    ctx,
    loc: canDirective.loc,
  })

  removeDirective(canDirective, ctx)
  return canInvocation
}

function transformCannotDirective(params: {
  directive: DirectiveNode
  pendingCan: PendingCan | null
  ifDirective: DirectiveNode | null
  ctx: WalkerContext
}): void {
  const { directive, pendingCan, ctx, ifDirective } = params

  if (directive.exp && directive.exp.type !== NodeTypes.SIMPLE_EXPRESSION) {
    raiseDirectiveError(ctx, directive.loc, '`v-cannot` expects a static expression (for example `v-cannot="can.x.y"`).')
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

  let expression = pendingCan?.expression

  if (directive.exp) {
    const expressionContent = directive.exp.content?.trim()
    if (!expressionContent) {
      raiseDirectiveError(ctx, directive.loc, '`v-cannot` requires a valid permission expression such as `can.employee.view`.')
    }

    const pathSegments = parseCanExpression(expressionContent, ctx, directive.loc)
    expression = buildCanInvocation(pathSegments)
  }

  if (!expression) {
    raiseDirectiveError(ctx, directive.loc, '`v-cannot` without an expression must immediately follow its matching `v-can`.')
  }

  ctx.patches.push({
    start: ctx.templateStart + directive.loc.start.offset,
    end: ctx.templateStart + directive.loc.end.offset,
    text: `v-if="!(${expression})"`,
  })
}

function parseCanExpression(expression: string, ctx: WalkerContext, loc: SourceLocation): string[] {
  const trimmed = expression.trim()
  if (!trimmed.length) {
    raiseDirectiveError(ctx, loc, '`v-can` requires a permission expression such as `can.resource.action`.')
  }

  const parts = trimmed.split('.')
  const root = parts.shift()
  const segments = parts

  if (!root || !CAN_IDENTIFIER.has(root)) {
    raiseDirectiveError(ctx, loc, '`v-can` expressions must start with `can.` or `$can.` (e.g. `v-can="can.employee.view"`).')
  }

  if (segments.length < 2) {
    raiseDirectiveError(ctx, loc, '`v-can` expects at least a resource and action (for example `can.employee.view`).')
  }

  if (segments.some(segment => !segment.length || !SEGMENT_PATTERN.test(segment))) {
    raiseDirectiveError(ctx, loc, '`v-can` only supports static dotted paths (letters, numbers, `_`, or `-`).')
  }

  return segments
}

function buildCanInvocation(segments: string[]): string {
  const escapedSegments = segments
    .map(segment => `'${segment.replace(/\\/g, '\\\\').replace(/'/g, '\u0027')}'`)
    .join(', ')

  return `__can__(${escapedSegments})`
}

function applyInheritedCanGuard(params: {
  segments: string[]
  ctx: WalkerContext
  branch: BranchKind
  conditionDirective: DirectiveNode | null
  elseDirective: DirectiveNode | null
  loc: SourceLocation
}): string {
  const { segments, ctx, branch, conditionDirective, elseDirective, loc } = params

  if (branch === 'plain') {
    raiseDirectiveError(ctx, loc, '`v-can` can only be inferred on `v-if` / `v-else-if` / `v-else` chains.')
  }

  const canInvocation = buildCanInvocation(segments)

  mergeGuardIntoConditional({
    branch,
    conditionDirective,
    elseDirective,
    canInvocation,
    ctx,
    loc,
  })

  return canInvocation
}

function mergeGuardIntoConditional(params: {
  branch: BranchKind
  conditionDirective: DirectiveNode | null
  elseDirective: DirectiveNode | null
  canInvocation: string
  ctx: WalkerContext
  loc: SourceLocation
}): void {
  const { branch, conditionDirective, elseDirective, canInvocation, ctx, loc } = params

  if (branch === 'if') {
    if (!conditionDirective) {
      raiseDirectiveError(ctx, loc, '`v-if` metadata missing while transforming `v-can`.')
    }

    const conditionExpression = getConditionExpression(conditionDirective, ctx, '`v-if` should carry a static expression when paired with `v-can`.')

    ctx.patches.push({
      start: ctx.templateStart + conditionDirective.loc.start.offset,
      end: ctx.templateStart + conditionDirective.loc.end.offset,
      text: `v-if="(${conditionExpression}) && ${canInvocation}"`,
    })

    return
  }

  if (branch === 'else-if') {
    if (!conditionDirective) {
      raiseDirectiveError(ctx, loc, '`v-else-if` metadata missing while transforming `v-can`.')
    }

    const conditionExpression = getConditionExpression(conditionDirective, ctx, '`v-else-if` should carry a static expression when paired with `v-can`.')

    ctx.patches.push({
      start: ctx.templateStart + conditionDirective.loc.start.offset,
      end: ctx.templateStart + conditionDirective.loc.end.offset,
      text: `v-else-if="(${conditionExpression}) && ${canInvocation}"`,
    })

    return
  }

  if (branch === 'else') {
    if (!elseDirective) {
      raiseDirectiveError(ctx, loc, '`v-else` metadata missing while transforming `v-can`.')
    }

    ctx.patches.push({
      start: ctx.templateStart + elseDirective.loc.start.offset,
      end: ctx.templateStart + elseDirective.loc.end.offset,
      text: `v-else-if="${canInvocation}"`,
    })

    return
  }
}

function determineBranchKind(directives: DirectiveSet): BranchKind {
  if (directives.ifDirective) return 'if'
  if (directives.elseIfDirective) return 'else-if'
  if (directives.elseDirective) return 'else'
  return 'plain'
}

function enforceConditionalChains(children: TemplateChildNode[], ctx: WalkerContext): void {
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index]
    if (!isTemplateChild(child) || child.type !== NodeTypes.ELEMENT) continue

    const directives = getDirectiveSet(child as ElementNode, ctx)
    if (!directives.ifDirective) continue

    const chain = collectConditionalChain(children, index, ctx)
    if (chain.length === 1) {
      index = chain[chain.length - 1].index
      continue
    }

    const canDirectives = chain.map(member => getDirectiveSet(member.node, ctx).canDirective)
    const referenceDirective = canDirectives.find((directive): directive is DirectiveNode => Boolean(directive))

    if (!referenceDirective) {
      index = chain[chain.length - 1].index
      continue
    }

    const expressionContent = referenceDirective.exp?.type === NodeTypes.SIMPLE_EXPRESSION ? referenceDirective.exp.content?.trim() : null
    if (!expressionContent) {
      raiseDirectiveError(ctx, referenceDirective.loc, '`v-can` requires a valid permission expression such as `can.employee.view`.')
    }

    const referenceSegments = getOrParseCanSegments(referenceDirective, expressionContent, ctx)

    for (let i = 0; i < chain.length; i += 1) {
      const directive = canDirectives[i]
      if (!directive) {
        ctx.inheritedCans.set(chain[i].node, referenceSegments)
        continue
      }

      const content = directive.exp?.type === NodeTypes.SIMPLE_EXPRESSION ? directive.exp.content?.trim() : null
      if (!content) {
        raiseDirectiveError(ctx, directive.loc, '`v-can` requires a valid permission expression such as `can.employee.view`.')
      }

      const segments = getOrParseCanSegments(directive, content, ctx)
      if (!areSegmentsEqual(referenceSegments, segments)) {
        raiseDirectiveError(ctx, directive.loc, '`v-can` expressions must match across every branch of the conditional chain.')
      }
    }

    index = chain[chain.length - 1].index
  }
}

function collectConditionalChain(children: TemplateChildNode[], startIndex: number, ctx: WalkerContext) {
  const chain: Array<{ node: ElementNode, index: number }> = [
    { node: children[startIndex] as ElementNode, index: startIndex },
  ]

  let cursor = startIndex + 1
  while (cursor < children.length) {
    const sibling = children[cursor]

    if (sibling?.type === NodeTypes.COMMENT) {
      cursor += 1
      continue
    }

    if (sibling?.type === NodeTypes.TEXT && sibling.content.trim().length === 0) {
      cursor += 1
      continue
    }

    if (!isTemplateChild(sibling) || sibling.type !== NodeTypes.ELEMENT) {
      break
    }

    const directives = getDirectiveSet(sibling as ElementNode, ctx)
    if (directives.elseIfDirective || directives.elseDirective) {
      chain.push({ node: sibling as ElementNode, index: cursor })
      cursor += 1
      continue
    }

    break
  }

  return chain
}

function getDirectiveSet(element: ElementNode, ctx: WalkerContext): DirectiveSet {
  const cached = ctx.directiveCache.get(element)
  if (cached) return cached

  const directives: DirectiveSet = {
    canDirective: null,
    cannotDirective: null,
    ifDirective: null,
    elseDirective: null,
    elseIfDirective: null,
  }

  for (const prop of element.props) {
    if (prop.type !== NodeTypes.DIRECTIVE) continue
    if (prop.name === 'can') directives.canDirective = prop
    if (prop.name === 'cannot') directives.cannotDirective = prop
    if (prop.name === 'if') directives.ifDirective = prop
    if (prop.name === 'else') directives.elseDirective = prop
    if (prop.name === 'else-if') directives.elseIfDirective = prop
  }

  ctx.directiveCache.set(element, directives)
  return directives
}

function getConditionExpression(directive: DirectiveNode, ctx: WalkerContext, message: string): string {
  if (!directive.exp || directive.exp.type !== NodeTypes.SIMPLE_EXPRESSION) {
    raiseDirectiveError(ctx, directive.loc, message)
  }

  return (directive.exp.content || 'true').trim() || 'true'
}

function removeDirective(directive: DirectiveNode, ctx: WalkerContext): void {
  ctx.patches.push({
    start: ctx.templateStart + directive.loc.start.offset,
    end: ctx.templateStart + directive.loc.end.offset,
    text: '',
  })
}

function getOrParseCanSegments(directive: DirectiveNode, expression: string, ctx: WalkerContext): string[] {
  const cached = (directive as DirectiveWithSegments)[CAN_SEGMENTS_SYMBOL]
  if (cached) return cached

  const segments = parseCanExpression(expression, ctx, directive.loc)
  ;(directive as DirectiveWithSegments)[CAN_SEGMENTS_SYMBOL] = segments
  return segments
}

function areSegmentsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((segment, index) => segment === b[index])
}
