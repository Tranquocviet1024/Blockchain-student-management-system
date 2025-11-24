import { useMemo } from "react";
import { useStudents } from "../hooks/useStudents";
import { useEvents } from "../hooks/useBlockchain";
import { AccountPanel } from "../components/AccountPanel";

const EVENT_LABELS = {
  RecordAdded: "Tạo hồ sơ",
  RecordUpdated: "Cập nhật hồ sơ",
  RecordDeactivated: "Vô hiệu hồ sơ",
  TeacherGranted: "Cấp quyền giáo viên",
  TeacherRevoked: "Thu hồi quyền giáo viên"
};

export function DashboardPage() {
  const {
    data: students = [],
    isLoading: studentsLoading,
    isError: studentsError
  } = useStudents();
  const {
    data: events = [],
    isLoading: eventsLoading,
    isError: eventsError,
    refetch: refetchEvents
  } = useEvents();

  const { totalStudents, activeStudents, inactiveStudents, lastUpdateText } = useMemo(() => {
    const total = students.length;
    const active = students.filter((student) => student.isActive).length;
    const inactive = total - active;
    const lastUpdated = students.reduce((latest, student) => {
      const timestamp = student.updatedAt ? new Date(student.updatedAt).getTime() : 0;
      return timestamp > latest ? timestamp : latest;
    }, 0);
    return {
      totalStudents: total,
      activeStudents: active,
      inactiveStudents: inactive,
      lastUpdateText: lastUpdated ? new Date(lastUpdated).toLocaleString() : "Chưa có cập nhật"
    };
  }, [students]);

  const recentStudents = useMemo(() => {
    return [...students]
      .sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [students]);

  const recentEvents = useMemo(() => events.slice(0, 5), [events]);
  const latestBlock = recentEvents[0]?.blockNumber ?? "-";
  const latestEventLabel = recentEvents[0]?.event
    ? EVENT_LABELS[recentEvents[0].event] || recentEvents[0].event
    : "Chưa có hoạt động chuỗi";

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Tổng quan</p>
          <h1 className="text-3xl font-bold text-slate-900">Bảng điều khiển</h1>
          <p className="text-slate-500 text-sm">
            Nắm tiến độ đồng bộ chuỗi khối và hoạt động hồ sơ trong một khung nhìn.
          </p>
        </div>
        <button
          onClick={() => refetchEvents()}
          className="px-5 py-3 rounded-full bg-brand-dark text-white font-semibold shadow-card transition hover:-translate-y-0.5"
        >
          Làm mới dữ liệu chuỗi
        </button>
      </div>

      <AccountPanel />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Tổng học sinh"
          value={totalStudents}
          loading={studentsLoading}
          helper={studentsError ? "Không thể tải" : `${activeStudents} đang hoạt động`}
        />
        <StatCard
          label="Đang hoạt động"
          value={activeStudents}
          loading={studentsLoading}
          helper={`${inactiveStudents} ngưng hoạt động`}
        />
        <StatCard
          label="Block mới nhất"
          value={latestBlock}
          loading={eventsLoading}
          helper={eventsError ? "Không đọc được sự kiện" : latestEventLabel}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Học sinh mới cập nhật" loading={studentsLoading} empty={!recentStudents.length}>
          <ul className="divide-y divide-white/60">
            {recentStudents.map((student) => (
              <li key={student.studentId} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{student.fullName}</p>
                  <p className="text-xs text-slate-500">{student.studentId}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    {student.updatedAt ? new Date(student.updatedAt).toLocaleString() : "-"}
                  </p>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full inline-block mt-1 ${
                      student.isActive
                        ? "bg-brand-light/80 text-brand-dark"
                        : "bg-slate-200/80 text-slate-600"
                    }`}
                  >
                    {student.isActive ? "Đang hoạt động" : "Ngưng hoạt động"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Sự kiện chuỗi gần đây" loading={eventsLoading} empty={!recentEvents.length}>
          <ul className="divide-y divide-white/60">
            {recentEvents.map((evt) => (
              <li key={`${evt.transactionHash}-${evt.logIndex ?? 0}`} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-slate-900">
                      {EVENT_LABELS[evt.event] || evt.event}
                    </p>
                    <p className="text-xs text-slate-500">Khối #{evt.blockNumber}</p>
                  </div>
                  <span className="text-xs font-mono text-slate-600">
                    {truncateHash(evt.transactionHash)}
                  </span>
                </div>
                {evt.args && Object.keys(evt.args).length > 0 && (
                  <dl className="mt-2 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                    {Object.entries(evt.args).map(([key, value]) => (
                      <div key={key}>
                        <dt className="uppercase tracking-wider text-slate-400">{key}</dt>
                        <dd className="font-mono break-all text-slate-700">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </section>
  );
}

function StatCard({ label, value, helper, loading }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-gradient-to-br from-brand-light/80 via-white to-white shadow-card p-6">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{label}</p>
      <p className="mt-4 text-4xl font-bold text-slate-900">
        {loading ? "..." : typeof value === "number" ? value : value || "-"}
      </p>
      <p className="text-sm text-slate-600 mt-2">{helper}</p>
    </div>
  );
}

function Panel({ title, loading, empty, children }) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-white/70 bg-white/80 backdrop-blur p-6 shadow-card">
        <p className="font-semibold text-slate-900 mb-2">{title}</p>
        <p className="text-slate-500 text-sm">Đang tải...</p>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="rounded-3xl border border-white/70 bg-white/80 backdrop-blur p-6 shadow-card">
        <p className="font-semibold text-slate-900 mb-2">{title}</p>
        <p className="text-slate-500 text-sm">Chưa có dữ liệu.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 backdrop-blur p-6 shadow-card">
      <p className="font-semibold text-slate-900 mb-4">{title}</p>
      {children}
    </div>
  );
}

function truncateHash(hash = "") {
  if (!hash) return "-";
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}
