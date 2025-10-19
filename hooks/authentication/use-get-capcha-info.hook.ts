import { useQuery } from '@tanstack/react-query';
import { CaptchaInfo } from './capcha.types';

import { API_BASE_URL } from '@/constants/api';

const fetchCaptchaInfo = async (): Promise<CaptchaInfo> => {
  const response = await fetch(`${API_BASE_URL}/api/v3/auth/captcha/info`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: CaptchaInfo = await response.json();
  return data;
};

export const useGetCaptchaInfo = () => useQuery({
    queryKey: ['captcha-info'],
    queryFn: fetchCaptchaInfo,
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000
  });
