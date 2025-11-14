import type { Patch } from './types'

export function applyPatches(source: string, patches: Patch[]): string {
  return [...patches]
    .sort((a, b) => b.start - a.start)
    .reduce((acc, patch) => acc.slice(0, patch.start) + patch.text + acc.slice(patch.end), source)
}
