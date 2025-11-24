import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { connectWallet } from "../services/wallet";
import { useWalletDetails } from "../hooks/useWalletDetails";
import { useBalance } from "../hooks/useBalance";

export function AccountPanel() {
  const { address, login } = useAuth();
  const { balance, network, isLoading, error, refresh } = useWalletDetails(address);
  const { data: virtualBalanceData, isLoading: isVirtualBalanceLoading } = useBalance();
  const [status, setStatus] = useState(null);
  const [switching, setSwitching] = useState(false);
  const mutationFeeEth = import.meta.env.VITE_MUTATION_FEE_ETH || "0.01";

  const handleCopy = async () => {
    if (!address || !navigator?.clipboard) return;
    await navigator.clipboard.writeText(address);
    setStatus("Đã sao chép địa chỉ");
    setTimeout(() => setStatus(null), 2500);
  };

  const handleSwitchWallet = async () => {
    try {
      setSwitching(true);
      const result = await connectWallet();
      login(result);
      await refresh();
      setStatus("Đã cập nhật ví");
    } catch (err) {
      setStatus(err.message || "Không thể chuyển ví");
    } finally {
      setSwitching(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 backdrop-blur shadow-card p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Ví đang dùng</p>
          <p className="text-lg font-semibold text-slate-900">
            {address ? truncateAddress(address) : "Chưa kết nối"}
          </p>
          <p className="text-xs text-slate-500">{network || "Không xác định"}</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!address}
          className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:border-brand-dark/40 hover:text-brand-dark disabled:opacity-50"
        >
          Sao chép địa chỉ
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-brand-light/70 to-brand-light/40 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Số dư ảo</p>
          <p className="mt-3 text-3xl font-bold text-brand-dark">
            {isVirtualBalanceLoading ? "..." : virtualBalanceData?.balanceEth ? `${parseFloat(virtualBalanceData.balanceEth).toFixed(2)} ETH` : "10,000 ETH"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Bắt đầu từ {virtualBalanceData?.initialBalanceEth || "10,000"} ETH</p>
        </div>
        <div className="rounded-2xl border border-white/60 bg-brand-light/50 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Số dư ví</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {isLoading ? "..." : balance ? `${balance} ETH` : "-"}
          </p>
          <p className="mt-1 text-xs text-slate-500">MetaMask wallet</p>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/60 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Mạng</p>
          <p className="mt-3 text-2xl font-bold text-slate-900">{network || "-"}</p>
          <p className="mt-1 text-xs text-slate-500">Blockchain network</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={refresh}
          disabled={isLoading || !address}
          className="px-5 py-3 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 hover:border-brand-dark/40 hover:text-brand-dark disabled:opacity-50"
        >
          Làm mới số dư
        </button>
        <button
          type="button"
          onClick={handleSwitchWallet}
          disabled={switching}
          className="px-5 py-3 rounded-full bg-accent text-slate-900 text-sm font-semibold shadow-card hover:bg-accent-dark disabled:opacity-60"
        >
          {switching ? "Đang đổi ví..." : "Chuyển ví"}
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Phí vận hành hiện tại: <span className="font-semibold text-slate-900">{mutationFeeEth} ETH</span> mỗi lần thêm/cập nhật/vô hiệu.
        {" "}Số dư ảo sẽ tự động giảm sau mỗi giao dịch. Số dư ví MetaMask được dùng để trả phí gas thực tế.
      </p>

      {(status || error) && (
        <p className={`text-xs ${error ? "text-rose-500" : "text-slate-500"}`}>
          {error || status}
        </p>
      )}
    </div>
  );
}

function truncateAddress(addr = "") {
  if (!addr) return "-";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
