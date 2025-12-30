import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
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










