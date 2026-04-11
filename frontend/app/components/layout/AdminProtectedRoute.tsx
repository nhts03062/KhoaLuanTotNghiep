import { appRoute } from '@/app/config/appRoute';
import { useAuthStore } from '@/app/stores/authStore';
import { Layout } from 'antd';
import { Router } from 'next/router';
import React, { useEffect } from 'react';
import { redirect } from 'next/navigation';

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading: authLoading, user } = useAuthStore();

  useEffect(() => {
    if (!authLoading && !isLoggedIn && user?.role !== 'ADMIN') {
      redirect(appRoute.home.root);
    }
  }, [authLoading, isLoggedIn, user?.role, Router]);
  return (
    <Layout className="min-h-screen">
      <main>{children}</main>
    </Layout>
  );
}

export default AdminProtectedRoute;
