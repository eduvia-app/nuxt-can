const pathSymbol = Symbol('nuxt-can:path')

export interface CanPathProxy {
  [segment: string]: CanPathProxy
  [pathSymbol]: string[]
}

const stringifyPath = (path: string[]) => path.join('.')

export function extractCanPath(value: unknown): string[] | null {
  if (value && typeof value === 'object' && pathSymbol in value) {
    return (value as CanPathProxy)[pathSymbol]
  }
  return null
}

export function createCanProxy(path: string[] = []): CanPathProxy {
  const target = () => path
  return new Proxy(target, {
    get(_target, prop) {
      if (prop === pathSymbol) {
        return path
      }
      if (prop === 'toString') {
        return () => stringifyPath(path)
      }
      if (prop === 'valueOf') {
        return () => path
      }
      if (prop === Symbol.toPrimitive) {
        return () => stringifyPath(path)
      }
      return createCanProxy([...path, String(prop)])
    },
    apply() {
      return path
    },
  }) as unknown as CanPathProxy
}
