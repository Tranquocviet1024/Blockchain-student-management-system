import { useState } from "react";
import { useEvents, useTransaction } from "../hooks/useBlockchain";

const EVENT_META = {
  RecordAdded: { label: "Tạo hồ sơ", pill: "bg-brand-light text-brand-dark" },
  RecordUpdated: { label: "Cập nhật hồ sơ", pill: "bg-sky-100 text-sky-700" },
  RecordDeactivated: { label: "Vô hiệu hồ sơ", pill: "bg-rose-100 text-rose-700" },
  TeacherGranted: { label: "Cấp quyền giáo viên", pill: "bg-amber-100 text-amber-700" },
  TeacherRevoked: { label: "Thu hồi quyền giáo viên", pill: "bg-fuchsia-100 text-fuchsia-700" }
};

export function TimelinePage() {
  const { data, isLoading, isError, refetch } = useEvents();
  const events = data ?? [];
  const [activeTx, setActiveTx] = useState("");
  const { data: txDetails, isLoading: isTxLoading } = useTransaction(activeTx);

  const handleOpenTx = (hash) => setActiveTx(hash);
  const handleCloseTx = () => setActiveTx("");

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Theo dõi</p>
          <h1 className="text-3xl font-bold text-slate-900">Dòng sự kiện blockchain</h1>
          <p className="text-slate-500 text-sm">
            Theo dõi hoạt động StudentRegistry mới nhất được đọc trực tiếp từ hợp đồng.
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
          Đang tải sự kiện...
        </div>
      )}
      {isError && (
        <div className="rounded-3xl border border-rose-100 bg-white/90 backdrop-blur p-6 text-rose-600 shadow-card">
          Không thể tải sự kiện lúc này.
        </div>
      )}

      {!isLoading && !isError && (
        <ol className="space-y-6">
          {events.map((evt) => {
            const key = `${evt.transactionHash}-${evt.logIndex ?? 0}`;
            const meta = EVENT_META[evt.event] ?? { label: evt.event, pill: "bg-slate-100 text-slate-600" };
            const argEntries = Object.entries(evt.args || {});
            return (
              <li key={key} className="relative pl-10">
                <span className="absolute left-4 top-4 h-3 w-3 rounded-full bg-brand-dark" />
                <span className="absolute left-4 top-4 bottom-0 w-px bg-gradient-to-b from-brand-dark via-transparent" />
                <div className="rounded-3xl border border-white/70 bg-white/90 backdrop-blur shadow-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${meta.pill}`}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-slate-500">Khối #{evt.blockNumber}</span>
                    </div>
                    <button
                      onClick={() => handleOpenTx(evt.transactionHash)}
                      className="text-xs font-semibold text-brand-dark hover:underline"
                    >
                      Xem giao dịch
                    </button>
                  </div>
                  {argEntries.length > 0 && (
                    <dl className="mt-4 grid gap-3 md:grid-cols-2 text-sm">
                      {argEntries.map(([label, value]) => (
                        <div key={label}>
                          <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
                          <dd className="font-mono text-slate-700 break-words">{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </li>
            );
          })}
          {events.length === 0 && (
            <li className="text-center text-slate-500 rounded-3xl border border-dashed border-white/60 bg-white/60 backdrop-blur py-12 shadow-card">
              Chưa có sự kiện nào. Hãy tạo hoặc cập nhật một hồ sơ để kích hoạt giao dịch.
            </li>
          )}
        </ol>
      )}

      <TransactionModal
        hash={activeTx}
        loading={isTxLoading}
        details={txDetails}
        onClose={handleCloseTx}
      />
    </section>
  );
}

function TransactionModal({ hash, loading, details, onClose }) {
  if (!hash) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl rounded-3xl border border-white/40 bg-white/95 backdrop-blur shadow-2xl space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Giao dịch</p>
            <p className="font-mono text-sm break-all text-slate-700">{hash}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-slate-200 text-slate-500 hover:text-brand-dark hover:border-brand-dark/40 transition"
            aria-label="Đóng giao dịch"
          >
            ✕
          </button>
        </div>

        {loading && <div className="text-slate-500">Đang tải thông tin giao dịch...</div>}
        {!loading && details && (
          <dl className="grid gap-4 md:grid-cols-2 text-sm">
            <InfoRow label="Trạng thái" value={details.status} />
            <InfoRow label="Từ" value={details.from} />
            <InfoRow label="Đến" value={details.to} />
            <InfoRow label="Khối" value={details.blockNumber} />
            <InfoRow label="Gas dùng" value={details.gasUsed ?? "-"} />
            <InfoRow label="Xác nhận" value={details.confirmations ?? 0} />
          </dl>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="font-mono text-slate-700 break-all">{value ?? "-"}</dd>
    </div>
  );
}
