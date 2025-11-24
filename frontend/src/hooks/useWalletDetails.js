import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, formatEther } from "ethers";

export function useWalletDetails(address) {
  const [balance, setBalance] = useState(null);
  const [network, setNetwork] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDetails = useCallback(async () => {
    if (!address || !window.ethereum) {
      setBalance(null);
      setNetwork(null);
      setError(address ? "Không tìm thấy ví" : null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const [rawBalance, networkInfo] = await Promise.all([
        provider.getBalance(address),
        provider.getNetwork()
      ]);
      const formattedBalance = Number.parseFloat(formatEther(rawBalance)).toFixed(4);
      setBalance(formattedBalance);
      setNetwork(networkInfo?.name ?? `Chain #${networkInfo?.chainId ?? "-"}`);
    } catch (err) {
      setError(err.message || "Không thể tải thông tin ví");
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  useEffect(() => {
    const handler = () => loadDetails();
    window.addEventListener("wallet:refresh", handler);
    return () => window.removeEventListener("wallet:refresh", handler);
  }, [loadDetails]);

  // Auto-refresh balance when new blocks are mined
  useEffect(() => {
    if (!address || !window.ethereum) return;
    let provider;
    const setupBlockListener = async () => {
      try {
        provider = new BrowserProvider(window.ethereum);
        const handler = () => loadDetails();
        provider.on("block", handler);
        return () => provider.off("block", handler);
      } catch (err) {
        console.error("Failed to setup block listener:", err);
      }
    };
    const cleanup = setupBlockListener();
    return () => {
      if (cleanup) cleanup.then(fn => fn && fn());
    };
  }, [address, loadDetails]);

  return {
    balance,
    network,
    isLoading,
    error,
    refresh: loadDetails
  };
}
