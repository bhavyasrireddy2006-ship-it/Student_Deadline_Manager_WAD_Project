import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case "/dashboard":
        return "Academic Dashboard";
      case "/tasks":
        return "Task Manager";
      case "/upcoming":
        return "Upcoming Deadlines";
      case "/calendar":
        return "Academic Calendar";
      default:
        return "Student Deadline Manager";
    }
  };

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="main-wrapper">
        <Navbar
          setMobileOpen={setMobileOpen}
          pageTitle={getPageTitle(location.pathname)}
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
