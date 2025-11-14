import { defineNuxtPlugin } from '#app'
import { useRuntimeConfig } from '#imports'
import { __can__ as hostCan } from '#build/nuxt-can/can-import.mjs'

import { createCanProxy } from './utils/create-can-proxy'

interface NuxtCanRuntimeConfig {
  permissions: Record<string, string[]>
  canFunctionImport: string
}

type NuxtCanChecker = (...path: string[]) => boolean | Promise<boolean>

export default defineNuxtPlugin((nuxtApp) => {
  const runtimeConfig = useRuntimeConfig()
  const moduleConfig = (runtimeConfig.public as { nuxtCan?: NuxtCanRuntimeConfig }).nuxtCan
  /* eslint-disable-next-line */
  const canProxy = createCanProxy() as any
  const canFunction = hostCan as NuxtCanChecker

  if (import.meta.dev && !moduleConfig?.canFunctionImport) {
    console.warn('[nuxt-can] `canFunctionImport` is missing. Configure it via `nuxtCan.canFunctionImport` in nuxt.config.ts.')
  }

  nuxtApp.vueApp.config.globalProperties.can = canProxy
  nuxtApp.vueApp.config.globalProperties.$can = canProxy
  nuxtApp.vueApp.config.globalProperties.__can__ = canFunction

  nuxtApp.provide('can', canProxy)
  nuxtApp.provide('__can__', canFunction)

  return {
    provide: {
      nuxtCan: moduleConfig ?? {
        permissions: {},
        canFunctionImport: '',
      },
    },
  }
})
