import { useQuery } from "@tanstack/react-query";
import { endpoints } from "../services/api";

export function useBalance() {
  return useQuery({
    queryKey: ["virtual-balance"],
    queryFn: async () => {
      const response = await endpoints.blockchain.balance();
      return response.data.data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 1000
  });
}
