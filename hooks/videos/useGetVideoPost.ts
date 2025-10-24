import { useQuery } from '@tanstack/react-query';

import { API_BASE_URL } from '@/constants/api';
import { VideoPost } from '@/types/video-post.interface';

export interface GetVideoPostParams {
  id: string;
}

const fetchVideoPost = async (token: string, id: string): Promise<VideoPost> => {
  const response = await fetch(`${API_BASE_URL}/api/v3/content/post?id=${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `sails.sid=${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch video post: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export const useGetVideoPost = (token?: string, id?: string) =>
  useQuery({
    queryKey: ['video-post', token, id],
    queryFn: () => fetchVideoPost(token!, id!),
    enabled: !!token && !!id,
  });
