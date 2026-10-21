import { Menu, LogOut } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";

export default function Navbar({ setMobileOpen, pageTitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "S";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>
        <h1 className="topbar-page-title">{pageTitle || "Dashboard"}</h1>
      </div>

      <div className="topbar-right">
        <div className="user-profile-menu">
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div className="user-details">
            <span className="user-name">{user?.name || "Student"}</span>
            <span className="user-role">{user?.email || "Academic User"}</span>
          </div>
        </div>

        <button
          className="btn-icon"
          title="Sign Out"
          onClick={handleLogout}
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
