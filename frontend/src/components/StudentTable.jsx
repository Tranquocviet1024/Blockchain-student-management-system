import { formatEther } from "ethers";

export function StudentTable({ students, onEdit, onDeactivate }) {
  if (!students?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-white/70 bg-white/60 backdrop-blur text-center text-slate-500 py-12 shadow-card">
        Chưa có học sinh nào. Hãy bắt đầu bằng cách thêm mới.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/60 bg-white/90 backdrop-blur shadow-card">
      <table className="min-w-full text-sm">
        <thead className="bg-brand-light/40 text-left text-slate-500">
          <tr>
            <th className="px-5 py-4 text-xs font-semibold">Học sinh</th>
            <th className="px-5 py-4 text-xs font-semibold">Lớp</th>
            <th className="px-5 py-4 text-xs font-semibold">Người giám hộ</th>
            <th className="px-5 py-4 text-xs font-semibold">Cập nhật</th>
            <th className="px-5 py-4 text-xs font-semibold">Trạng thái</th>
            <th className="px-5 py-4 text-xs font-semibold">Phí gần nhất</th>
            <th className="px-5 py-4 text-xs font-semibold text-right">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/70">
          {students.map((student) => {
            const active = isStudentActive(student);
            return (
              <tr key={student.studentId}>
              <td className="px-5 py-4">
                <div className="font-semibold text-slate-900">{student.fullName}</div>
                <div className="text-xs text-slate-500">{student.studentId}</div>
              </td>
              <td className="px-5 py-4 text-slate-600">{student.className}</td>
              <td className="px-5 py-4 text-slate-600">{student.guardian || "-"}</td>
              <td className="px-5 py-4 text-xs text-slate-500">
                {student.updatedAt ? new Date(student.updatedAt).toLocaleString() : "-"}
              </td>
              <td className="px-5 py-4">
                <span
                  className={`px-3 py-1 text-xs rounded-full font-semibold ${
                    active ? "bg-brand-light text-brand-dark" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {active ? "Đang hoạt động" : "Ngưng hoạt động"}
                </span>
              </td>
              <td className="px-5 py-4">
                {student.lastFeeTxHash ? (
                  <div className="space-y-1">
                    <p className="font-mono text-xs text-brand-dark" title={student.lastFeeTxHash}>
                      {truncateHash(student.lastFeeTxHash)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFee(student.lastFeeAmountWei)}
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Chưa thu phí</span>
                )}
              </td>
              <td className="px-5 py-4 text-right">
                <div className="inline-flex gap-3">
                  <button
                    onClick={() => onEdit(student)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:text-brand-dark hover:border-brand-dark/40 transition"
                  >
                    Sửa
                  </button>
                  {active && (
                    <button
                      onClick={() => onDeactivate(student)}
                      className="px-4 py-2 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100 transition"
                    >
                      Vô hiệu
                    </button>
                  )}
                </div>
              </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function truncateHash(hash = "") {
  if (!hash) return "-";
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

function formatFee(amountWei) {
  if (!amountWei) return "-";
  try {
    const eth = Number.parseFloat(formatEther(amountWei));
    return `${eth.toFixed(4)} ETH`;
  } catch {
    return "-";
  }
}

function isStudentActive(student = {}) {
  if (typeof student.isActive === "boolean") {
    return student.isActive;
  }
  if (typeof student.status === "string") {
    return student.status !== "inactive";
  }
  return true;
}
