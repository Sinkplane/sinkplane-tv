import { useQuery } from '@tanstack/react-query';

import { API_BASE_URL } from '@/constants/api';
import { VideoDelivery } from '@/types/video-delivery.interface';

export interface GetVideoDeliveryParams {
  videoId: string;
  quality?: string;
  live?: boolean;
}

const fetchVideoDelivery = async (token: string, _tokenExpiration: string | undefined, id: string, live: boolean = false): Promise<VideoDelivery> => {
  const scenario = live ? 'live' : 'onDemand';
  const entityKind = live ? '&entityKind=livestream' : '';
  const response = await fetch(`${API_BASE_URL}/api/v3/delivery/info?scenario=${scenario}&entityId=${id}${entityKind}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch video delivery: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export const useGetVideoDelivery = (token?: string, tokenExpiration?: string, id?: string, live: boolean = false) =>
  useQuery({
    queryKey: ['video-delivery', token, tokenExpiration, id, live],
    queryFn: () => fetchVideoDelivery(token!, tokenExpiration, id!, live),
    enabled: !!token && !!id,
    staleTime: 30000, // 30 seconds
    gcTime: 30000, // 30 seconds (formerly cacheTime)
  });
