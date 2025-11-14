export interface ModuleOptions {
  permissions?: Record<string, string[]>
  /**
   * Module specifier to import the host-provided __can__ function from.
   * Example: '~/permissions/__can__'
   */
  canFunctionImport?: string
  /**
   * Enable verbose template diff logging while developing the transformer.
   */
  reporter?: boolean
}

export interface NuxtCanRuntimeConfig {
  permissions: Record<string, string[]>
  canFunctionImport: string
}
