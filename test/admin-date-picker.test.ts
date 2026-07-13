import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import test from 'node:test'

test('admin routes use responsive calendar components instead of native date fields', () => {
  const files = [
    ...globSync('app/pages/admin/**/*.vue'),
    ...globSync('app/components/admin/**/*.vue'),
  ]
  const nativeDateControl = /type=["'](?:date|datetime-local)["']/
  const offenders = files.filter(file => nativeDateControl.test(readFileSync(file, 'utf8')))
  assert.deepEqual(offenders, [])
})

test('shared admin date picker provides desktop popover and mobile bottom sheet', () => {
  const source = readFileSync('app/components/admin/AdminDatePicker.vue', 'utf8')
  assert.match(source, /<Popover/)
  assert.match(source, /<Sheet/)
  assert.match(source, /side="bottom"/)
  assert.match(source, /md:hidden/)
  assert.match(source, /hidden w-full justify-start font-normal md:flex/)
})
