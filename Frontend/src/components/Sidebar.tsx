import {
  LayoutDashboard,
  ScanLine,
  History,
  FileText,
  LogOut,
  ShieldCheck
} from "lucide-react";

import { Link, useLocation } from "react-router-dom";

function Sidebar() {

  const location = useLocation();

  const menu = [
    {
      name: "Dashboard",
      path: "/inspector",
      icon: LayoutDashboard
    },
    {
      name: "Scan Product",
      path: "/inspector/scan",
      icon: ScanLine
    },
    {
      name: "Inspection History",
      path: "/inspector/history",
      icon: History
    },
    {
      name: "Reports",
      path: "/inspector/report",
      icon: FileText
    }
  ];

  return (
    <aside className="sidebar">

      <div className="sidebar-logo">
        <ShieldCheck size={28} />
        <span>NIRIKSHAK <b>AI</b></span>
      </div>

      <div className="sidebar-menu">

        {menu.map((item) => {

          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={
                location.pathname === item.path
                  ? "sidebar-item active"
                  : "sidebar-item"
              }
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );

        })}

      </div>

      <Link to="/" className="sidebar-logout">
        <LogOut size={20} />
        Logout
      </Link>

    </aside>
  );
}

export default Sidebar;