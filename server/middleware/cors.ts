/**
 * CORS middleware for API routes
 * 
 * Handles Cross-Origin Resource Sharing for:
 * - Preview deploys (*.netlify.app)
 * - www vs non-www domain differences
 * - Development (localhost)
 */

export default defineEventHandler((event) => {
  const origin = getRequestHeader(event, 'origin');
  
  // Only apply to API routes
  const path = getRequestURL(event).pathname;
  if (!path.startsWith('/api/')) {
    return;
  }
  
  // Allowed origins
  const allowedOrigins = [
    'https://salehyundai.com.au',
    'https://www.salehyundai.com.au',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  
  // Also allow Netlify preview deploys
  const isNetlifyPreview = origin?.endsWith('.netlify.app');
  
  if (origin && (allowedOrigins.includes(origin) || isNetlifyPreview)) {
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    });
  }
  
  // Handle preflight requests
  if (getMethod(event) === 'OPTIONS') {
    setResponseStatus(event, 204);
    return '';
  }
});
