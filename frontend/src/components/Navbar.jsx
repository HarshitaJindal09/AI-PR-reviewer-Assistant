import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="header">
      <NavLink to="/" className="logo">
        <span className="logo-icon">AI</span>
        <span>Code Review Assistant</span>
      </NavLink>

      <nav className="nav-links">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          Home
        </NavLink>
        <NavLink
          to="/analyze"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          Analyze a PR
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          Review History
        </NavLink>
      </nav>

      <div className="header-badge">AI Powered</div>
    </header>
  );
}

export default Navbar;
