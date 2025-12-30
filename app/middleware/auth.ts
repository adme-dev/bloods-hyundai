export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip auth check for login page
  if (to.path === '/admin/login') {
    return;
  }
  
  // Check if user is authenticated
  try {
    const { data, error } = await useFetch('/api/auth/me');
    
    if (error.value || !data.value?.user) {
      return navigateTo('/admin/login');
    }
  } catch (err) {
    return navigateTo('/admin/login');
  }
});










