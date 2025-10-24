import { useQuery } from '@tanstack/react-query';

import { API_BASE_URL } from '@/constants/api';
import { VideoDelivery } from '@/types/video-delivery.interface';

export interface GetVideoDeliveryParams {
  videoId: string;
  quality?: string;
}

const fetchVideoDelivery = async (token: string, id: string): Promise<VideoDelivery> => {
  const response = await fetch(`${API_BASE_URL}/api/v3/delivery/info?scenario=onDemand&entityId=${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `sails.sid=${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch video delivery: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export const useGetVideoDelivery = (token?: string, id?: string) =>
  useQuery({
    queryKey: ['video-delivery', token, id],
    queryFn: () => fetchVideoDelivery(token!, id!),
    enabled: !!token && !!id,
  });
