import { useQuery } from '@tanstack/react-query';

import { API_BASE_URL } from '@/constants/api';
import { IStatusResponse } from '@/types/status.interface';
import { getHeaders } from './useHeaders';
import { ApiResponse } from '@/types/api-response.interface';

export const fetchProfile = async (token: string, tokenExpiration?: string): Promise<ApiResponse<IStatusResponse>> => {
  const response = await fetch(`${API_BASE_URL}/api/v3/status?platform=web&version=4.4.8`, {
    method: 'GET',
    credentials: 'include',
    headers: getHeaders({ token, tokenExpiration }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch profile: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export const useGetProfile = (token?: string, tokenExpiration?: string) =>
  useQuery({
    queryKey: ['profile', token, tokenExpiration],
    queryFn: () => fetchProfile(token!, tokenExpiration),
    enabled: !!token,
    staleTime: 0,
    gcTime: 0,
  });
