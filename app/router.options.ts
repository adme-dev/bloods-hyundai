import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    const isAdminNavigation = to.path.startsWith('/admin') && from.path.startsWith('/admin')

    // Admin controls frequently update query state (tabs, filters, pagination).
    // Preserve the current workspace position for those same-page updates instead
    // of applying the public site's animated scroll-to-top behavior.
    if (isAdminNavigation && to.path === from.path) {
      return savedPosition || false
    }

    // A genuine admin page change should begin at the top, but without the
    // storefront's smooth-scroll transition.
    if (to.path.startsWith('/admin')) {
      return savedPosition || { top: 0, left: 0 }
    }

    // For special-offers routes, don't scroll to top - let the page handle scrolling
    if (to.path.startsWith('/special-offers')) {
      return false
    }
    
    // For other routes, use saved position or scroll to top
    if (savedPosition) {
      return savedPosition
    }
    
    // If there's a hash, scroll to that element
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }
    
    // Default: scroll to top with smooth behavior
    return { 
      top: 0, 
      left: 0,
      behavior: 'smooth'
    }
  }
}









