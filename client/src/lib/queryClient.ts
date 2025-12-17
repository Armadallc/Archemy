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
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Check session and handle expiration
    if (sessionError) {
      console.error('❌ [AUTH] Session error:', sessionError);
    }
    
    if (session) {
      // Check if session is expired or about to expire (within 5 minutes)
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const timeUntilExpiry = expiresAt - now;
      
      // If session is expired or expires within 5 minutes, try to refresh it
      if (timeUntilExpiry < 300) { // 5 minutes
        console.log('🔄 [AUTH] Session expiring soon, refreshing...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('❌ [AUTH] Failed to refresh session:', refreshError);
        } else if (refreshedSession) {
          console.log('✅ [AUTH] Session refreshed');
          session = refreshedSession;
        }
      }
      
      authToken = session?.access_token || null;
    } else {
      authToken = null;
      console.warn('⚠️ [AUTH] No session found');
    }
  } catch (error) {
    console.error('❌ [AUTH DEBUG] Could not get Supabase session:', error);
  }
  
  // Fallback to localStorage only if Supabase session fails
  if (!authToken) {
    authToken = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
  }
  
  const headers: any = data ? { "Content-Type": "application/json" } : {};
  
  // Add Authorization header if token exists
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  } else {
    console.warn('⚠️ [AUTH] No token available for request to:', url);
  }
  
  // Add base URL if the URL doesn't start with http
  // Use environment variable, or detect from current hostname for network access
  let apiBaseUrl = import.meta.env.VITE_API_URL;
  if (!apiBaseUrl) {
    // If accessing from network IP, use the same hostname for API
    const currentHost = window.location.hostname;
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      apiBaseUrl = 'http://localhost:8081';
    } else {
      // Use the same hostname but port 8081 for API
      apiBaseUrl = `http://${currentHost}:8081`;
    }
  }
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
    // Use environment variable, or detect from current hostname for network access
    let apiBaseUrl = import.meta.env.VITE_API_URL;
    if (!apiBaseUrl) {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        apiBaseUrl = 'http://localhost:8081';
      } else {
        // Use the same hostname but port 8081 for API
        apiBaseUrl = `http://${currentHost}:8081`;
      }
    }
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
