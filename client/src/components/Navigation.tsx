import { Link, useLocation } from 'react-router-dom';
import '../styles/Navigation.css';

interface NavigationProps {
  user: {
    fullName: string;
    role: string;
    region: string;
  };
  onLogout: () => void;
}

function Navigation({ user, onLogout }: NavigationProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <img src="/logo.png" alt="GlobalSync" className="nav-logo" />
        <div className="nav-brand-text">
          <h2>GlobalSync</h2>
          <span className="nav-subtitle">Team Hub</span>
        </div>
      </div>

      <div className="nav-links">
        <Link to="/" className={isActive('/') ? 'nav-link active' : 'nav-link'}>
          📊 Dashboard
        </Link>
        <Link to="/tasks" className={isActive('/tasks') ? 'nav-link active' : 'nav-link'}>
          ✓ Tasks
        </Link>
        <Link to="/team" className={isActive('/team') ? 'nav-link active' : 'nav-link'}>
          👥 Team
        </Link>
      </div>

      <div className="nav-user">
        <div className="user-info">
          <div className="user-name">{user.fullName}</div>
          <div className="user-role">{user.role.replace('_', ' ')} • {user.region}</div>
        </div>
        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navigation;

