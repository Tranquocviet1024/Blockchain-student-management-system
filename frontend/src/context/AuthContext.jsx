import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedAddress = localStorage.getItem("address");
    if (storedToken && storedAddress) {
      setToken(storedToken);
      setAddress(storedAddress);
    }
  }, []);

  const login = useCallback(({ address: walletAddress, token: authToken }) => {
    setAddress(walletAddress);
    setToken(authToken);
    localStorage.setItem("token", authToken);
    localStorage.setItem("address", walletAddress);
  }, []);

  const logout = useCallback(() => {
    setAddress(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("address");
  }, []);

  useEffect(() => {
    if (!window.ethereum) return undefined;

    const handleAccountsChanged = (accounts = []) => {
      if (!accounts.length) {
        logout();
        return;
      }
      const nextAddress = accounts[0];
      if (!address) return;
      if (nextAddress?.toLowerCase() !== address?.toLowerCase()) {
        logout();
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [address, logout]);

  const value = useMemo(
    () => ({
      address,
      token,
      isAuthenticated: Boolean(address && token),
      login,
      logout
    }),
    [address, token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
