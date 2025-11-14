export function __can__(path: string[]) {
  const key = path.join('.')
  const allowed = new Set([
    'employee.view',
    'employee.edit',
    'contract.create',
  ])

  // return allowed.has(key)
  console.log('Checking permission:', key)
  return false
}
