import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { TopNav } from "./TopNav";

export function PrivateRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-transparent">
      <TopNav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-3xl bg-white/80 backdrop-blur border border-white/50 shadow-card">
          <div className="p-6 md:p-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
