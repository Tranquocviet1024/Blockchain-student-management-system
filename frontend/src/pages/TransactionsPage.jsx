import { useTransactionHistory } from "../hooks/useBlockchain";

const EVENT_LABELS = {
  RecordAdded: "Tạo hồ sơ",
  RecordUpdated: "Cập nhật hồ sơ",
  RecordDeactivated: "Vô hiệu hồ sơ",
  TeacherGranted: "Cấp quyền giáo viên",
  TeacherRevoked: "Thu hồi quyền giáo viên"
};

const STATUS_CLASSES = {
  success: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  pending: "bg-amber-100 text-amber-700"
};

export function TransactionsPage() {
  const { data: history = [], isLoading, isError, refetch } = useTransactionHistory();

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Dòng tiền</p>
          <h1 className="text-3xl font-bold text-slate-900">Lịch sử giao dịch</h1>
          <p className="text-slate-500 text-sm">
            Theo dõi từng giao dịch từ hợp đồng StudentRegistry gồm trạng thái, gas và sự kiện phát sinh.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-5 py-3 rounded-full bg-brand-dark text-white font-semibold shadow-card transition hover:-translate-y-0.5"
        >
          Làm mới
        </button>
      </div>

      {isLoading && (
        <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur p-6 text-slate-500 shadow-card">
          Đang tải lịch sử giao dịch...
        </div>
      )}
      {isError && (
        <div className="rounded-3xl border border-rose-100 bg-white/90 backdrop-blur p-6 text-rose-600 shadow-card">
          Không thể tải lịch sử giao dịch. Vui lòng thử lại.
        </div>
      )}

      {!isLoading && !isError && history.length > 0 && (
        <div className="overflow-x-auto rounded-3xl border border-white/60 bg-white/90 backdrop-blur shadow-card">
          <table className="min-w-full text-sm">
            <thead className="bg-brand-light/40 text-left text-slate-500">
              <tr>
                <th className="px-5 py-4 text-xs font-semibold">Sự kiện</th>
                <th className="px-5 py-4 text-xs font-semibold">Giao dịch</th>
                <th className="px-5 py-4 text-xs font-semibold">Khối</th>
                <th className="px-5 py-4 text-xs font-semibold">Thời gian</th>
                <th className="px-5 py-4 text-xs font-semibold">Trạng thái</th>
                <th className="px-5 py-4 text-xs font-semibold">Gas dùng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/70">
              {history.map((item) => (
                <tr key={item.hash}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">
                      {EVENT_LABELS[item.event] || item.event || "Không rõ"}
                    </p>
                    {item.args?.studentId && (
                      <p className="text-xs text-slate-500">ID: {item.args.studentId}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs text-brand-dark break-all">{item.hash}</p>
                    <p className="text-xs text-slate-500">{truncateAddress(item.from)}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">#{item.blockNumber ?? "-"}</td>
                  <td className="px-5 py-4 text-slate-600">{formatTimestamp(item.timestamp)}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        STATUS_CLASSES[item.status] ?? "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {statusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{item.gasUsed ? `${item.gasUsed}` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !isError && history.length === 0 && (
        <div className="text-center rounded-3xl border border-dashed border-white/70 bg-white/60 backdrop-blur py-12 text-slate-500 shadow-card">
          Chưa có giao dịch nào được ghi nhận.
        </div>
      )}
    </section>
  );
}

function formatTimestamp(isoString) {
  if (!isoString) return "-";
  try {
    return new Date(isoString).toLocaleString();
  } catch {
    return "-";
  }
}

function truncateAddress(addr) {
  if (!addr) return "-";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function statusLabel(status) {
  switch (status) {
    case "success":
      return "Thành công";
    case "failed":
      return "Thất bại";
    case "pending":
      return "Đang xử lý";
    default:
      return status ?? "Không rõ";
  }
}
