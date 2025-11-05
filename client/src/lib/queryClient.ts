import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorText;
    try {
      const errorData = await res.json();
      console.error('❌ API Error Response:', {
        status: res.status,
        statusText: res.statusText,
        url: res.url,
        error: errorData
      });
      errorText = JSON.stringify(errorData);
    } catch {
      const text = await res.text();
      console.error('❌ API Error Response (non-JSON):', {
        status: res.status,
        statusText: res.statusText,
        url: res.url,
        body: text
      });
      errorText = text || res.statusText;
    }
    throw new Error(`${res.status}: ${errorText}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get auth token from Supabase session (PRIORITY)
  let authToken = null;
  
  // Try to get token from Supabase session FIRST (most reliable)
  try {
    // Import supabase client dynamically to avoid circular imports
    const { supabase } = await import('../lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    // Reduced logging to prevent console spam
    // console.log('🔍 apiRequest: Supabase session:', session ? 'found' : 'not found');
    // if (session) {
    //   console.log('🔍 apiRequest: Session access token:', session.access_token ? 'found' : 'not found');
    // }
    authToken = session?.access_token || null;
  } catch (error) {
    // Only log errors, not every request
    if (import.meta.env.DEV) {
      console.warn('Could not get Supabase session:', error);
    }
  }
  
  // Fallback to localStorage only if Supabase session fails
  if (!authToken) {
    authToken = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
    // console.log('🔍 apiRequest: localStorage fallback token:', authToken ? 'found' : 'not found'); // Disabled to reduce console spam
  }
  
  const headers: any = data ? { "Content-Type": "application/json" } : {};
  
  // Add Authorization header if token exists
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
    // console.log('🔍 apiRequest: Sending token:', authToken.substring(0, 20) + '...'); // Disabled to reduce console spam
  } else {
    // Only log missing token as warning, not on every request
    // console.log('🔍 apiRequest: No token found'); // Disabled to reduce console spam
  }
  
  // Add base URL if the URL doesn't start with http
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
  const fullUrl = url.startsWith('http') ? url : `${apiBaseUrl}${url}`;
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get auth token from Supabase session (PRIORITY)
    let authToken = null;
    
    // Try to get token from Supabase session FIRST (most reliable)
    try {
      // Import supabase client dynamically to avoid circular imports
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      authToken = session?.access_token || null;
    } catch (error) {
      console.warn('Could not get Supabase session:', error);
    }
    
    // Fallback to localStorage only if Supabase session fails
    if (!authToken) {
      authToken = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
    }
    
    const headers: any = {};
    
    // Add Authorization header if token exists
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    // Add base URL if the URL doesn't start with http
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
    const fullUrl = (queryKey[0] as string).startsWith('http') ? queryKey[0] as string : `${apiBaseUrl}${queryKey[0] as string}`;
    
    const res = await fetch(fullUrl, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
