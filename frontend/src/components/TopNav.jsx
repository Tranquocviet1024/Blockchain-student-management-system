import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { to: "/dashboard", label: "Tổng quan" },
  { to: "/students", label: "Học sinh" },
  { to: "/timeline", label: "Dòng sự kiện" },
  { to: "/transactions", label: "Giao dịch" }
];

export function TopNav() {
  const { address, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-white/60 shadow-card">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Trung tâm</p>
          <p className="text-xl font-bold text-brand-dark">Quản trị hồ sơ chuỗi khối</p>
          <p className="text-xs text-slate-500">
            Ví hiện tại: <span className="font-mono text-slate-700">{address || "Chưa kết nối"}</span>
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-2 md:justify-end">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-semibold transition ${
                  isActive
                    ? "bg-brand-dark text-white shadow-card"
                    : "text-slate-600 hover:text-brand-dark hover:bg-brand-light/60"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="ml-1 px-4 py-2 rounded-full bg-accent text-slate-900 font-semibold shadow-card transition hover:bg-accent-dark hover:-translate-y-0.5"
          >
            Đăng xuất
          </button>
        </nav>
      </div>
    </header>
  );
}
