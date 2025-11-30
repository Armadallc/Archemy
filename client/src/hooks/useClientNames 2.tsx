import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
}

interface ClientNamesHook {
  getClientName: (clientId: string) => string;
  getClientInitials: (clientId: string) => string;
  isLoading: boolean;
}

export function useClientNames(): ClientNamesHook {
  const { data: clients, isLoading } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/clients');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getClientName = (clientId: string): string => {
    if (!clients || !Array.isArray(clients)) return 'Unknown Client';
    
    const client = clients.find((c: Client) => c.id === clientId);
    if (!client) return 'Unknown Client';
    
    return `${client.first_name} ${client.last_name}`.trim();
  };

  const getClientInitials = (clientId: string): string => {
    if (!clients || !Array.isArray(clients)) return '??';
    
    const client = clients.find((c: Client) => c.id === clientId);
    if (!client) return '??';
    
    const firstInitial = client.first_name?.[0]?.toUpperCase() || '';
    const lastInitial = client.last_name?.[0]?.toUpperCase() || '';
    
    return `${firstInitial}${lastInitial}` || '??';
  };

  return {
    getClientName,
    getClientInitials,
    isLoading,
  };
}
