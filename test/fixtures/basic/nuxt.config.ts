import NuxtCan from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    NuxtCan,
  ],
  nuxtCan: {
    permissions: {
      employee: ['view', 'edit', 'delete'],
      contract: ['create'],
    },
    canFunctionImport: '~/permissions/__can__',
  },
})
