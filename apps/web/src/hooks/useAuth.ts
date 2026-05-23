'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useRouter } from 'next/navigation';

interface UserRole {
  role: { name: string; permissions: { resource: string; action: string }[] };
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  isActive: boolean;
  userRoles: UserRole[];
}

function setAuthCookie(token: string | null) {
  if (typeof document === 'undefined') return;
  if (token) {
    // SameSite=Strict cookie readable by middleware (not HttpOnly so JS can clear it)
    document.cookie = `axon_access_token=1; path=/; SameSite=Strict; max-age=${15 * 60}`;
  } else {
    document.cookie = 'axon_access_token=; path=/; max-age=0';
  }
}

export function useAuth() {
  const qc = useQueryClient();
  const router = useRouter();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;
      try {
        const res = await apiClient.get('/auth/me');
        return res.data as AuthUser;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (creds: { email: string; password: string }) =>
      apiClient.post('/auth/login', creds).then((r) => r.data),
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setAuthCookie(data.accessToken);
      qc.invalidateQueries({ queryKey: ['auth-me'] });
      router.push('/dashboard');
    },
  });

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAuthCookie(null);
    qc.clear();
    router.push('/login');
  };

  return { user, isLoading, login: loginMutation, logout };
}
