import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('chains fixture', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/chains', import.meta.url)),
  })

  it('hides every branch when permission is missing and falls back to v-cannot', async () => {
    const html = await $fetch('/')
    expect(html).not.toContain('id="branch-pending"')
    expect(html).toContain('id="branch-denied"')
  })

  it('renders explicit v-cannot blocks even when detached from the chain', async () => {
    const html = await $fetch('/')
    expect(html).toContain('id="explicit-denied"')
    expect(html).not.toContain('id="approve-action"')
  })
})
