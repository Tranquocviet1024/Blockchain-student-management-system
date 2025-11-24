import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { connectWallet } from "../services/wallet";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleConnect = async () => {
    try {
      setLoading(true);
      const result = await connectWallet();
      login(result);
      setError(null);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Không thể kết nối ví");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg w-full rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-card p-8 space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Chuỗi khối</p>
          <h1 className="text-4xl font-bold text-slate-900">Hồ sơ học sinh</h1>
          <p className="text-slate-500">
            Đăng nhập bằng MetaMask để quản trị hồ sơ được bảo vệ trên blockchain.
          </p>
        </div>
        <button
          className="w-full px-6 py-4 rounded-full bg-brand-dark text-white font-semibold shadow-card transition hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
          onClick={handleConnect}
          disabled={loading}
        >
          {loading ? "Đang kết nối..." : "Kết nối MetaMask"}
        </button>
        {error && <p className="text-sm text-rose-500">{error}</p>}
      </div>
    </main>
  );
}
