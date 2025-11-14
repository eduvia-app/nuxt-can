import type { TemplateChildNode } from '@vue/compiler-dom'

export function isTemplateChild(node: unknown): node is TemplateChildNode {
  return !!node && typeof node === 'object' && 'type' in node
}
