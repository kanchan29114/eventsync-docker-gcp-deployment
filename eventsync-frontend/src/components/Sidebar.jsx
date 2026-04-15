import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, CheckSquare, Settings, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useContext(AuthContext);

  const navItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    transition: 'background-color var(--transition-speed), color var(--transition-speed)',
    marginBottom: '0.5rem'
  };

  const activeStyle = {
    ...navItemStyle,
    backgroundColor: 'var(--primary-color)',
    color: 'white'
  };

  return (
    <div style={{
      width: '250px',
      backgroundColor: 'var(--surface-color)',
      borderRight: '1px solid var(--border-color)',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ 
          width: '32px', height: '32px', 
          backgroundColor: 'var(--primary-color)', 
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 'bold'
        }}>
          E
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>EventSync</h1>
      </div>

      <nav style={{ flex: 1 }}>
        <NavLink 
          to="/" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          style={navItemStyle}
        >
          <Calendar size={20} />
          Dashboard
        </NavLink>
        <NavLink 
          to="/my-tasks" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          style={navItemStyle}
        >
          <CheckSquare size={20} />
          My Tasks
        </NavLink>
        <NavLink 
          to="/settings" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          style={navItemStyle}
        >
          <Settings size={20} />
          Settings
        </NavLink>
      </nav>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: '36px', height: '36px', 
            borderRadius: '50%', backgroundColor: 'var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, color: 'var(--text-secondary)'
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="btn" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger-color)' }}>
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
