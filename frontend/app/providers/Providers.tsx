"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthHydrator from "../components/AuthHydrator";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator />
      {children}
    </QueryClientProvider>
  );
}
