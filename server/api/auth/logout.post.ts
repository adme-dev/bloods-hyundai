export default defineEventHandler(async (event) => {
  // Clear auth cookies
  deleteCookie(event, 'auth_token');
  deleteCookie(event, 'refresh_token');
  
  return {
    success: true,
    message: 'Logged out successfully',
  };
});







