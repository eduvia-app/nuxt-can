export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  nuxtCan: {
    reporter: true
    // permissions: {
    //   employee: ['view', 'edit'],
    //   contract: ['create'],
    // },
    // canFunctionImport: '~/permissions/__can__',
  },
})
