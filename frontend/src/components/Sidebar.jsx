import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Calendar,
  LogOut,
  BookOpen,
  X,
} from "lucide-react";
import { useAuth } from "../context/useAuth";

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { name: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { name: "My Tasks", to: "/tasks", icon: CheckSquare },
    { name: "Upcoming", to: "/upcoming", icon: Clock },
    { name: "Calendar", to: "/calendar", icon: Calendar },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand-icon-box">
            <BookOpen size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="brand-title">Deadline Manager</h2>
            <p className="brand-subtitle">Student Portal</p>
          </div>
          {mobileOpen && (
            <button
              className="btn-icon"
              onClick={() => setMobileOpen(false)}
              style={{ display: "flex", border: "none" }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `nav-link-item ${isActive ? "active" : ""}`
                }
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={18} />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
