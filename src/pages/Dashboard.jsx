import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api';
import { useAuth } from '../auth.jsx';
import { currentYear, useMeta } from '../meta.js';
import { DateTile, Empty, StatusPill, TypeTag } from '../components/ui.jsx';

const STATUS_COLORS = { draft: '#94a3b8', submitted: '#d97706', approved: '#16a34a', rejected: '#dc2626' };

export default function Dashboard() {
  const { user } = useAuth();
  const meta = useMeta();
  const [ay, setAy] = useState(currentYear());
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  useEffect(() => {
    api.get('/stats', { params: { academicYear: ay } }).then((r) => setStats(r.data));
    api.get('/activities', { params: { academicYear: ay } }).then((r) => setRecent(r.data.slice(0, 6)));
  }, [ay]);
  if (!meta || !stats) return <div className="splash">Loading…</div>;

  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const st = Object.fromEntries(stats.byStatus.map((s) => [s._id, s.n]));
  const typeData = stats.byType.map((t) => ({ name: meta.types[t._id]?.label, n: t.n, color: meta.types[t._id]?.color })).sort((a, b) => b.n - a.n);
  const statusData = Object.entries(st).map(([k, n]) => ({ name: k, n }));
  const needsReview = user.role !== 'faculty' && st.submitted > 0;

  return (
    <>
      <header className="pagehead">
        <div><h1>{greet}, {user.name.split(' ')[0]}</h1><p className="muted">{user.role === 'admin' ? 'All departments' : `${user.department} department`}</p></div>
        <select value={ay} onChange={(e) => setAy(e.target.value)} aria-label="Academic year">{meta.academicYears.map((y) => <option key={y} value={y}>AY {y}</option>)}</select>
      </header>

      {needsReview && <Link to="/activities?status=submitted" className="alert warn">{st.submitted} {st.submitted === 1 ? 'activity is' : 'activities are'} waiting for your approval. Review now</Link>}

      <div className="stats card">
        <div><b>{stats.total}</b><span>Activities</span></div>
        <div><b>{stats.participants}</b><span>Student participations</span></div>
        <div><b>{st.approved || 0}</b><span>Approved</span></div>
        <div><b>{(st.submitted || 0) + (st.draft || 0)}</b><span>In progress</span></div>
      </div>

      {stats.total === 0 ? (
        <Empty title="No activities in this academic year yet"><Link to="/activities/new" className="btn primary">Add the first activity</Link></Empty>
      ) : (
        <>
          <div className="grid2">
            <div className="card">
              <h3>Activities by type</h3>
              <ResponsiveContainer width="100%" height={Math.max(180, typeData.length * 38)}>
                <BarChart data={typeData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis type="category" dataKey="name" width={150} tickLine={false} axisLine={false} tick={{ fontSize: 13, fill: '#44546a' }} />
                  <Tooltip cursor={{ fill: '#f1f4f9' }} />
                  <Bar dataKey="n" name="Activities" radius={[0, 8, 8, 0]} barSize={18}>{typeData.map((d) => <Cell key={d.name} fill={d.color} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3>Approval status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={statusData} dataKey="n" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>{statusData.map((d) => <Cell key={d.name} fill={STATUS_COLORS[d.name]} />)}</Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
              <div className="legend">{statusData.map((d) => <span key={d.name}><i style={{ background: STATUS_COLORS[d.name] }} />{d.name} {d.n}</span>)}</div>
            </div>
          </div>

          <div className="card list">
            <div className="listhead"><h3>Recent activities</h3><Link to="/activities">View all</Link></div>
            {recent.map((a) => (
              <Link key={a._id} to={`/activities/${a._id}`} className="row" style={{ '--c': meta.types[a.type]?.color }}>
                <DateTile date={a.startDate} color={meta.types[a.type]?.color} />
                <div className="rowmain"><b>{a.title}</b><TypeTag meta={meta.types[a.type]} /></div>
                <span className="muted count">{a.participantCount} students</span>
                <StatusPill status={a.status} />
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
