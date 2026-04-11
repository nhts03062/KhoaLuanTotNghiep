"use client";

import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";

/** Gọi initAuth khi app mount để restore session từ localStorage */
export default function AuthHydrator() {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return null;
}
