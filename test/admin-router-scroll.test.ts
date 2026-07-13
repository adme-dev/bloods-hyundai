import assert from 'node:assert/strict'
import test from 'node:test'
import routerOptions from '../app/router.options'

const scrollBehavior = routerOptions.scrollBehavior!
const route = (path: string, hash = '') => ({ path, hash }) as never

test('admin query and tab navigation preserves the current scroll position', () => {
  assert.equal(
    scrollBehavior(route('/admin/enquiries'), route('/admin/enquiries'), null),
    false,
  )
})

test('admin history navigation restores its saved position', () => {
  const savedPosition = { left: 0, top: 640 }
  assert.deepEqual(
    scrollBehavior(route('/admin/enquiries'), route('/admin/enquiries'), savedPosition),
    savedPosition,
  )
})

test('navigation to another admin route starts at the top without smooth scrolling', () => {
  assert.deepEqual(
    scrollBehavior(route('/admin/customers'), route('/admin/enquiries'), null),
    { left: 0, top: 0 },
  )
})

test('public route navigation keeps the existing smooth scroll behavior', () => {
  assert.deepEqual(
    scrollBehavior(route('/contact'), route('/'), null),
    { left: 0, top: 0, behavior: 'smooth' },
  )
})
