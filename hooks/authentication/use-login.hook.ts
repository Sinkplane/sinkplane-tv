import { useMutation } from '@tanstack/react-query';
import { IUser } from './user.interface';

import { API_BASE_URL } from '@/constants/api';

export interface LoginRequest {
  username: string;
  password: string;
  captchaToken?: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  needs2FA?: boolean;
  user?: IUser;
  message?: string;
}

const login = async (request: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v3/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: LoginResponse = await response.json();
  return data;
};

export const useLogin = () => useMutation({
    mutationFn: login
  });
