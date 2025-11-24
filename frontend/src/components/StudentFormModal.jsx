import { useEffect, useState } from "react";

const emptyStudent = {
  studentId: "",
  fullName: "",
  className: "",
  birthday: "",
  guardian: "",
  notes: ""
};

export function StudentFormModal({ open, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(emptyStudent);
  const mutationFeeEth = import.meta.env.VITE_MUTATION_FEE_ETH || "0.01";

  useEffect(() => {
    if (initialData) {
      setForm({
        studentId: initialData.studentId,
        fullName: initialData.fullName,
        className: initialData.className,
        birthday: initialData.birthday || "",
        guardian: initialData.guardian || "",
        notes: initialData.notes || ""
      });
    } else {
      setForm(emptyStudent);
    }
  }, [initialData]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="relative max-w-2xl w-full rounded-3xl border border-white/40 bg-white/90 backdrop-blur shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
              {initialData ? "Cập nhật" : "Tạo mới"}
            </p>
            <h2 className="text-2xl font-bold text-slate-900">
              {initialData ? "Cập nhật học sinh" : "Thêm học sinh"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-slate-200 text-slate-500 hover:text-brand-dark hover:border-brand-dark/40 transition"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Mã học sinh">
              <input
                className="input-field"
                name="studentId"
                value={form.studentId}
                onChange={handleChange}
                required
                disabled={Boolean(initialData)}
              />
            </Field>
            <Field label="Lớp">
              <input
                className="input-field"
                name="className"
                value={form.className}
                onChange={handleChange}
                required
              />
            </Field>
          </div>
          <Field label="Họ và tên">
            <input
              className="input-field"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Ngày sinh">
              <input
                type="date"
                className="input-field"
                name="birthday"
                value={form.birthday}
                onChange={handleChange}
              />
            </Field>
            <Field label="Người giám hộ">
              <input
                className="input-field"
                name="guardian"
                value={form.guardian}
                onChange={handleChange}
              />
            </Field>
          </div>
          <Field label="Ghi chú">
            <textarea
              className="input-field resize-none"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
            />
          </Field>
          <div className="flex flex-col gap-3 pt-4">
            <p className="text-xs text-slate-500">
              Việc gửi biểu mẫu sẽ thu {mutationFeeEth} ETH từ ví của bạn cho phí đồng bộ chuỗi.
            </p>
            <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 hover:text-brand-dark hover:border-brand-dark/50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-brand-dark text-white text-sm font-semibold shadow-card transition hover:-translate-y-0.5"
            >
              {initialData ? "Lưu thay đổi" : "Tạo hồ sơ"}
            </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="text-sm font-medium text-slate-600 flex flex-col gap-1">
      {label}
      {children}
    </label>
  );
}
