import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('ssr', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('renders the allowed branches when permissions pass', async () => {
    const html = await $fetch('/')
    expect(html).toContain('<h1>basic</h1>')
    expect(html).toContain('id="can-view"')
    expect(html).toContain('id="can-edit"')
    expect(html).toContain('Creation contrat')
  })

  it('falls back to the `v-cannot` branch when the permission is missing', async () => {
    const html = await $fetch('/')
    expect(html).not.toContain('id="can-delete"')
    expect(html).toContain('id="cannot-delete"')
    expect(html).toContain('Suppression interdite')
  })

  it('exposes the can proxy globally for template usage', async () => {
    const html = await $fetch('/')
    expect(html).toMatch(/id="path-display"[\s\S]*employee\.view/)
  })
})
