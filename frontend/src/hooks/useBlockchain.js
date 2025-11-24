import { useQuery } from "@tanstack/react-query";
import { endpoints } from "../services/api";

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await endpoints.blockchain.events();
      return response.data.data ?? [];
    },
    refetchInterval: 10000
  });
}

export function useTransaction(hash) {
  return useQuery({
    queryKey: ["tx", hash],
    queryFn: async () => {
      if (!hash) return null;
      const response = await endpoints.blockchain.tx(hash);
      return response.data.data;
    },
    enabled: Boolean(hash)
  });
}

export function useTransactionHistory() {
  return useQuery({
    queryKey: ["tx-history"],
    queryFn: async () => {
      const response = await endpoints.blockchain.history();
      return response.data.data ?? [];
    },
    refetchInterval: 15000
  });
}
