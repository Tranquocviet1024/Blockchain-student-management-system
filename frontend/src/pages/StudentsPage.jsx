import { useState } from "react";
import { StudentFormModal } from "../components/StudentFormModal";
import { StudentTable } from "../components/StudentTable";
import {
  useCreateStudent,
  useDeactivateStudent,
  useStudents,
  useUpdateStudent
} from "../hooks/useStudents";

export function StudentsPage() {
  const { data: students, isLoading, isError } = useStudents();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const mutationFeeEth = import.meta.env.VITE_MUTATION_FEE_ETH || "0.01";

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deactivateStudent = useDeactivateStudent();

  const handleAdd = () => {
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleDeactivate = (student) => {
    if (student.isActive) {
      deactivateStudent.mutate(student.studentId);
    }
  };

  const handleSubmit = (payload) => {
    if (selectedStudent) {
      updateStudent.mutate(
        { studentId: selectedStudent.studentId, payload },
        {
          onSuccess: () => setIsModalOpen(false)
        }
      );
    } else {
      createStudent.mutate(payload, {
        onSuccess: () => setIsModalOpen(false)
      });
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Quản lý</p>
          <h1 className="text-3xl font-bold text-slate-900">Danh sách học sinh</h1>
          <p className="text-slate-500 text-sm">
            Đồng bộ toàn bộ hồ sơ với hợp đồng StudentRegistry chỉ trong vài thao tác.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="px-6 py-3 rounded-full bg-accent text-slate-900 font-semibold shadow-card transition hover:bg-accent-dark hover:-translate-y-0.5"
        >
          + Thêm học sinh
        </button>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur p-5 shadow-card text-sm text-slate-600">
        <p>
          Mỗi thao tác thêm/cập nhật/vô hiệu sẽ tự động thu <span className="font-semibold text-slate-900">{mutationFeeEth} ETH</span>
          {" "}từ ví đang đăng nhập để đồng bộ với StudentRegistry. Phí này giúp đảm bảo việc ghi dữ liệu lên chuỗi.
        </p>
      </div>

      {isLoading && (
        <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur p-6 text-slate-500 shadow-card">
          Đang tải danh sách...
        </div>
      )}
      {isError && (
        <div className="rounded-3xl border border-rose-100 bg-white/90 backdrop-blur p-6 text-rose-600 shadow-card">
          Không thể tải danh sách. Vui lòng thử lại.
        </div>
      )}

      {!isLoading && !isError && (
        <StudentTable
          students={students}
          onEdit={handleEdit}
          onDeactivate={handleDeactivate}
        />
      )}

      <StudentFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedStudent}
      />
    </section>
  );
}
