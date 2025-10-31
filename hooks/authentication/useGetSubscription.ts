import { useQuery } from '@tanstack/react-query';

import { Subscription } from '@/types/subscriptions.interface';

import { API_BASE_URL } from '@/constants/api';
import { getHeaders } from './useHeaders';

export const fetchSubscriptions = async (token: string, tokenExpiration?: string): Promise<Subscription[]> => {
  const response = await fetch(`${API_BASE_URL}/api/v3/user/subscriptions?active=true`, {
    method: 'GET',
    credentials: 'include',
    headers: getHeaders({ token, tokenExpiration }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch subscriptions: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export const useGetSubscriptions = (token?: string, tokenExpiration?: string) =>
  useQuery({
    queryKey: ['subscriptions', token, tokenExpiration],
    queryFn: () => fetchSubscriptions(token!, tokenExpiration),
    enabled: !!token,
  });
