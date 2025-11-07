import { useQuery } from '@tanstack/react-query';

import { API_BASE_URL } from '@/constants/api';
import { VideoPost } from '@/types/video-post.interface';

export interface GetVideoPostParams {
  id: string;
}

const fetchVideoPost = async (token: string, _tokenExpiration: string | undefined, id: string): Promise<VideoPost> => {
  const response = await fetch(`${API_BASE_URL}/api/v3/content/post?id=${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch video post: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export const useGetVideoPost = (token?: string, tokenExpiration?: string, id?: string) =>
  useQuery({
    queryKey: ['video-post', token, tokenExpiration, id],
    queryFn: () => fetchVideoPost(token!, tokenExpiration, id!),
    enabled: !!token && !!id,
  });
