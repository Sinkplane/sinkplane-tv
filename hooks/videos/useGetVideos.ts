import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

import { API_BASE_URL } from '@/constants/api';
import { Video } from '@/types/video.interface';

export interface GetVideosParams {
  id: string;
  limit?: number;
  fetchAfter?: number;
  search?: string;
  sort?: 'DESC' | 'ASC';
  hasVideo?: boolean;
  hasAudio?: boolean;
  hasPicture?: boolean;
  hasText?: boolean;
}

const fetchVideos = async (token: string, params: GetVideosParams): Promise<Video[]> => {
  const {
    id,
    limit = 10,
    fetchAfter = 0,
    search = '',
    sort = 'DESC',
    hasVideo = false,
    hasAudio = false,
    hasPicture = false,
    hasText = false,
  } = params;

  const queryParams = new URLSearchParams({
    id,
    limit: limit.toString(),
    fetchAfter: fetchAfter.toString(),
    search,
    sort,
    hasVideo: hasVideo.toString(),
    hasAudio: hasAudio.toString(),
    hasPicture: hasPicture.toString(),
    hasText: hasText.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/api/v3/content/creator?${queryParams.toString()}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `sails.sid=${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch videos: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.info(data);
  return data;
};

export const useGetVideos = (token?: string, params?: GetVideosParams) =>
  useQuery({
    queryKey: ['videos', token, params],
    queryFn: () => fetchVideos(token!, params!),
    enabled: !!token && !!params?.id,
  });

export const useGetVideosInfinite = (token?: string, params?: Omit<GetVideosParams, 'fetchAfter'>) =>
  useInfiniteQuery({
    queryKey: ['videos-infinite', token, params],
    queryFn: ({ pageParam = 0 }) => fetchVideos(token!, { ...params!, fetchAfter: pageParam }),
    enabled: !!token && !!params?.id,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer videos than the limit, we've reached the end
      const limit = params?.limit || 10;
      if (lastPage.length < limit) {
        return undefined;
      }
      // Calculate the next offset based on total videos fetched so far
      return allPages.reduce((total, page) => total + page.length, 0);
    },
  });
