import { addPlugin, addTemplate, addTypeTemplate, addVitePlugin, createResolver, defineNuxtModule, resolvePath } from '@nuxt/kit'

import { transformCan } from './runtime/transformer/transform-can'
import { CAN_IMPORT_TEMPLATE_FILENAME, CONFIG_KEY, DEFAULT_CAN_FUNCTION_IMPORT, TYPES_TEMPLATE_FILENAME } from './module/constants'
import { generateTypeDeclaration } from './module/typegen'
import type { ModuleOptions } from './module/types'

export { CONFIG_KEY }
export type { ModuleOptions }

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-can',
    configKey: CONFIG_KEY,
    compatibility: {
      nuxt: '^3.0.0 || ^4.0.0',
    },
  },
  defaults: {
    permissions: {},
    canFunctionImport: DEFAULT_CAN_FUNCTION_IMPORT,
    reporter: false,
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    /* eslint-disable-next-line */
    const permissions = options.permissions ?? {} as any
    const canFunctionImport = options.canFunctionImport ?? DEFAULT_CAN_FUNCTION_IMPORT
    const reporter = options.reporter ?? false

    const publicConfig = nuxt.options.runtimeConfig.public
    publicConfig[CONFIG_KEY] = {
      permissions,
      canFunctionImport,
    }

    const resolvedCanFnImport = await resolvePath(canFunctionImport, {
      alias: nuxt.options.alias,
      cwd: nuxt.options.srcDir,
    })

    addPlugin(resolver.resolve('./runtime/plugin'))

    addTemplate({
      filename: CAN_IMPORT_TEMPLATE_FILENAME,
      getContents: () => `export { __can__ } from '${resolvedCanFnImport}'\n`,
    })

    addTypeTemplate({
      filename: TYPES_TEMPLATE_FILENAME,
      getContents: () => generateTypeDeclaration(permissions),
    })

    addVitePlugin({
      name: 'vite-plugin-nuxt-can',
      enforce: 'pre',
      transform(code, id) {
        return transformCan({ code, id, reporter })
      },
    })
  },
})
