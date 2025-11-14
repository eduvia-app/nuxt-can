export function __can__(...path: string[]) {
  const key = path.join('.')
  const allowed = new Set([
    'employee.view',
    'employee.edit',
    'contract.create',
  ])

  const granted = allowed.has(key)
  console.log('Checking permission:', key, '->', granted)
  return false
}
