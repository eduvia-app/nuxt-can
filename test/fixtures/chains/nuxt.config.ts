import NuxtCan from '../../../src/module'

export default defineNuxtConfig({
  modules: [NuxtCan],
  nuxtCan: {
    permissions: {
      employee: ['view'],
      contract: ['approve'],
    },
    canFunctionImport: '~/permissions/__can__',
  },
})
