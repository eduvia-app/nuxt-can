// modules/nuxt-can.ts
import { defineNuxtModule, addVitePlugin } from '@nuxt/kit'

import { transformCan } from './runtime/transformer/transform-can'

export interface ModuleOptions {
  reporter: boolean
}

export const CONFIG_KEY = 'nuxtCan'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-can',
    configKey: CONFIG_KEY,
  },

  defaults: {
    reporter: false,
  },

  setup(options) {
    addVitePlugin({
      name: 'vite-plugin-nuxt-can',
      enforce: 'pre',
      transform(code, id) {
        return transformCan({ code, id, reporter: options.reporter })
      },
    })
  },
})
