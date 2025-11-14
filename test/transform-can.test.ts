import { describe, it, expect } from 'vitest'

import { transformCan } from '../src/runtime/transformer/transform-can'

const TEST_FILE = `${process.cwd()}/components/Test.vue`

const buildSFC = (template: string) => `<template>\n${template}\n</template>`

const runTransform = (template: string) => {
  const result = transformCan({ code: buildSFC(template), id: TEST_FILE })
  return result?.code ?? ''
}

describe('transformCan', () => {
  it('injects __can__ guards and a matching v-cannot block', () => {
    const code = runTransform(`
      <button v-can="can.employee.view">Voir</button>
      <p v-cannot>Refus</p>
    `)

    expect(code).toContain(`v-if="__can__(['employee', 'view'])"`)
    expect(code).toContain(`v-if="!(__can__(['employee', 'view']))"`)
  })

  it('merges existing v-if expressions with the generated guard', () => {
    const code = runTransform(`
      <div v-if="isReady" v-can="can.contract.create" />
    `)

    expect(code).toContain(`v-if="(isReady) && __can__(['contract', 'create'])"`)
  })

  it('throws when v-cannot is used without a preceding v-can', () => {
    const exec = () => transformCan({
      code: buildSFC('<p v-cannot>Denied</p>'),
      id: TEST_FILE,
    })

    expect(exec).toThrow(/must immediately follow its `v-can`/)
  })

  it('throws when the expression does not start with can.*', () => {
    const exec = () => transformCan({
      code: buildSFC('<button v-can="permissions.employee.view" />'),
      id: TEST_FILE,
    })

    expect(exec).toThrow(/expressions must start with `can\.`/)
  })

  it('throws when v-can is added to a v-else branch', () => {
    const exec = () => transformCan({
      code: buildSFC(`
        <div v-if="ready"></div>
        <div v-else v-can="can.employee.view"></div>
      `),
      id: TEST_FILE,
    })

    expect(exec).toThrow(/cannot be used on `v-else`/)
  })
})
