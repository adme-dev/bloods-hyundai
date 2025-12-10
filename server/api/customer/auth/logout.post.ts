export default defineEventHandler(async (event) => {
  deleteCookie(event, 'customer_token');

  return {
    success: true,
    message: 'Logged out successfully',
  };
});
