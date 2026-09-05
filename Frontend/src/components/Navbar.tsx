import { ShieldCheck, Menu } from "lucide-react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">

      <Link to="/" className="logo">
        <ShieldCheck size={30} />
        <span>NIRIKSHAK <b>AI</b></span>
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/public-scan">Public Scan</Link>
        <Link to="/login" className="nav-login">
          Inspector Login
        </Link>
      </div>

      <button className="mobile-menu">
        <Menu size={24} />
      </button>

    </nav>
  );
}

export default Navbar;