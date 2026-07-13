import assert from 'node:assert/strict'
import test from 'node:test'
import { formatAdminDate } from '../app/utils/dashboardFormat'

test('admin dates render identically during SSR and hydration', () => {
  assert.equal(formatAdminDate('2026-07-01'), '1 Jul 2026')
  assert.equal(formatAdminDate('2026-07-11T08:30:00Z'), '11 Jul 2026')
})

test('admin date formatting preserves malformed values', () => {
  assert.equal(formatAdminDate('not-a-date'), 'not-a-date')
})
