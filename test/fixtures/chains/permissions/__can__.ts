const granted = new Set<string>([])

export function __can__(...path: string[]) {
  const key = path.join('.')
  return granted.has(key)
}
