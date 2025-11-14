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

    expect(code).toContain(`v-if="__can__('employee', 'view')"`)
    expect(code).toContain(`v-if="!(__can__('employee', 'view'))"`)
  })

  it('merges existing v-if expressions with the generated guard', () => {
    const code = runTransform(`
      <div v-if="isReady" v-can="can.contract.create" />
    `)

    expect(code).toContain(`v-if="(isReady) && __can__('contract', 'create')"`)
  })

  it('throws when v-cannot is used without a preceding v-can', () => {
    const exec = () => transformCan({
      code: buildSFC('<p v-cannot>Denied</p>'),
      id: TEST_FILE,
    })

    expect(exec).toThrow(/without an expression must immediately follow/)
  })

  it('throws when the expression does not start with can.*', () => {
    const exec = () => transformCan({
      code: buildSFC('<button v-can="permissions.employee.view" />'),
      id: TEST_FILE,
    })

    expect(exec).toThrow(/expressions must start with `can\.`/)
  })

  it('mirrors guards across v-if / v-else-if / v-else chains when the first branch uses v-can', () => {
    const code = runTransform(`
      <div v-if="ready" v-can="can.employee.view"></div>
      <div v-else-if="later"></div>
      <div v-else></div>
      <p v-cannot>Denied</p>
    `)

    expect(code).toContain(`v-if="(ready) && __can__('employee', 'view')"`)
    expect(code).toContain(`v-else-if="(later) && __can__('employee', 'view')"`)
    expect(code).toContain(`v-else-if="__can__('employee', 'view')"`)
    expect(code).toContain(`v-if="!(__can__('employee', 'view'))"`)
  })

  it('throws when branches declare different v-can expressions', () => {
    const exec = () => transformCan({
      code: buildSFC(`
        <div v-if="ready" v-can="can.employee.view"></div>
        <div v-else v-can="can.contract.create"></div>
      `),
      id: TEST_FILE,
    })

    expect(exec).toThrow(/must match across every branch/)
  })

  it('allows explicit expressions on v-cannot without a preceding v-can', () => {
    const code = runTransform('<p v-cannot="can.employee.view">Denied</p>')
    expect(code).toContain(`v-if="!(__can__('employee', 'view'))"`)
  })

  it('requires adjacent placement for v-cannot without an expression', () => {
    const exec = () => transformCan({
      code: buildSFC(`
        <div v-can="can.employee.view">Allowed</div>
        <div>
          <p v-cannot>Denied</p>
        </div>
      `),
      id: TEST_FILE,
    })

    expect(exec).toThrow(/without an expression must immediately follow/)
  })

  it('requires adjacency even when only empty siblings exist between v-can and v-cannot', () => {
    const exec = () => transformCan({
      code: buildSFC(`
        <div v-can="can.employee.view">Allowed</div>
        <div></div>
        <div v-cannot>Denied</div>
      `),
      id: TEST_FILE,
    })

    expect(exec).toThrow(/without an expression must immediately follow/)
  })
})
