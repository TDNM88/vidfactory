"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RouteGuard({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (adminOnly && !payload.isAdmin) {
        router.replace('/profile');
      }
    } catch {
      localStorage.removeItem('token');
      router.replace('/login');
    }
  }, [adminOnly, router]);
  return <>{children}</>;
}
