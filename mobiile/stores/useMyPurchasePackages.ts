import { getMyPurchasePackages } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

export const useMyPurchasePackages = (enabled = true) => {
  return useQuery({
    queryKey: ["my-purchase-packages"],
    queryFn: getMyPurchasePackages,
    enabled,
  });
};
