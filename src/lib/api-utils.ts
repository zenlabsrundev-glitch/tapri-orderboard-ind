/**
 * Utility to construct safe API URLs that handle trailing slashes and ensure /api prefix.
 */
export const getApiBase = (endpoint: string) => {
  const envUrl = process.env.REACT_APP_API_URL;
  
  if (!envUrl) {
    return `/api/${endpoint}`;
  }
  
  // Remove trailing slash if present
  let base = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  
  // Ensure the base includes /api if it's pointing to the root domain
  // (unless it already explicitly includes /api)
  if (!base.toLowerCase().includes('/api')) {
    base = `${base}/api`;
  }
  
  return `${base}/${endpoint}`;
};
