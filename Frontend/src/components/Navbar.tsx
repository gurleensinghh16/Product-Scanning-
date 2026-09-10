import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

function Navbar() {
  return (
    <nav className="navbar">

      <Link to="/" className="logo">
        <img src={logo} alt="NIRIKSHAK AI Logo" />
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