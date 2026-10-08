export const api = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('urimaiyalar_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      console.warn(`Auth Error on ${endpoint}:`, response.status);
      // In a real app, you might trigger a global logout event here
    }
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `API Error: ${response.status}`);
  }

  return response;
};
