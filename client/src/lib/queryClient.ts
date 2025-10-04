import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get auth token from Supabase session
  let authToken = null;
  
  // Try to get token from localStorage first (fallback)
  authToken = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
  
  // If no token in localStorage, try to get from Supabase session
  if (!authToken) {
    try {
      // Import supabase client dynamically to avoid circular imports
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      authToken = session?.access_token || null;
    } catch (error) {
      console.warn('Could not get Supabase session:', error);
    }
  }
  
  const headers: any = data ? { "Content-Type": "application/json" } : {};
  
  // Add Authorization header if token exists
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  // Add base URL if the URL doesn't start with http
  const fullUrl = url.startsWith('http') ? url : `http://localhost:8081${url}`;
  
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
    // Get auth token from Supabase session
    let authToken = null;
    
    // Try to get token from localStorage first (fallback)
    authToken = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
    
    // If no token in localStorage, try to get from Supabase session
    if (!authToken) {
      try {
        // Import supabase client dynamically to avoid circular imports
        const { supabase } = await import('../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || null;
      } catch (error) {
        console.warn('Could not get Supabase session:', error);
      }
    }
    
    const headers: any = {};
    
    // Add Authorization header if token exists
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    // Add base URL if the URL doesn't start with http
    const fullUrl = (queryKey[0] as string).startsWith('http') ? queryKey[0] as string : `http://localhost:8081${queryKey[0] as string}`;
    
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
