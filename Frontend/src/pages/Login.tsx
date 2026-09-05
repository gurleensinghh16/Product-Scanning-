import { ShieldCheck, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function Login() {

  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Temporary frontend login.
    // Real authentication will be connected to backend later.
    navigate("/inspector");
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">
          <ShieldCheck size={40} />
        </div>

        <h1>NIRIKSHAK AI</h1>

        <p className="login-subtitle">
          Authorized Inspector Portal
        </p>

        <form onSubmit={handleLogin}>

          <label>
            Inspector ID
          </label>

          <input
            type="text"
            placeholder="Enter inspector ID"
            required
          />

          <label>
            Password
          </label>

          <input
            type="password"
            placeholder="Enter password"
            required
          />

          <button type="submit" className="primary-btn login-btn">
            <Lock size={18} />
            Secure Login
          </button>

        </form>

        <Link to="/" className="back-link">
          ← Back to Home
        </Link>

      </div>

    </div>
  );
}

export default Login;