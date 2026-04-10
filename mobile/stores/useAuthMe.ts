import { getMe } from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";

export const useAuthMe = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const data = await getMe();
      console.log(data);
      setUser(data);
      return data;
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
  });
};
