const granted = new Set([
  'employee.view',
  'employee.edit',
  'contract.create',
])

export function __can__(path: string[]) {
  const key = Array.isArray(path) ? path.join('.') : String(path)
  return granted.has(key)
}
