import { NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, LogOut, PlusCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../auth.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const link = ({ isActive }) => (isActive ? 'active' : '');
  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><Sparkles size={20} /><div><b>Activity Hub</b><small>Aditya University</small></div></div>
        <nav className="nav">
          <NavLink to="/" end className={link}><LayoutDashboard size={18} />Dashboard</NavLink>
          <NavLink to="/activities" end className={link}><CalendarDays size={18} />Activities</NavLink>
          <NavLink to="/activities/new" className={link}><PlusCircle size={18} />New activity</NavLink>
        </nav>
        <div className="me">
          <div className="avatar">{user.name[0]}</div>
          <div className="who"><b>{user.name}</b><small>{user.role} · {user.department}</small></div>
          <button className="icon" onClick={logout} title="Log out" aria-label="Log out"><LogOut size={18} /></button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}
