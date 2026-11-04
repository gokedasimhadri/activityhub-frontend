import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import api, { errMsg } from '../api';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

export default function Registrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');

  const loadRegistrations = () => {
    setLoading(true);
    setErr('');
    api.get('/activities/student-registrations')
      .then((r) => setRegistrations(r.data))
      .catch((e) => setErr(errMsg(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const filtered = registrations.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.studentName || '').toLowerCase().includes(q) ||
      (r.rollNumber || '').toLowerCase().includes(q) ||
      (r.activityTitle || '').toLowerCase().includes(q) ||
      (r.activityType || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <header className="pagehead">
        <div>
          <h1>Student Registrations</h1>
          <p className="muted">Self-service student registrations across all activities</p>
        </div>
        <button className="btn ghost" onClick={loadRegistrations} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      <div className="toolbar" style={{ marginBottom: '1.25rem' }}>
        <label className="search" style={{ maxWidth: '400px' }}>
          <Search size={16} />
          <input
            placeholder="Search by student, roll number, or activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {err && <div className="alert err">{err}</div>}

      {loading ? (
        <div className="splash">Loading registrations…</div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <p className="muted pad" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            {registrations.length === 0 ? 'No student registrations recorded yet.' : 'No registrations match your search.'}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="tablewrap">
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Activity</th>
                  <th>Type</th>
                  <th>Registered At</th>
                  <th>Submitted Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => (
                  <tr key={r._id || idx}>
                    <td>{idx + 1}</td>
                    <td><b>{r.studentName || '—'}</b></td>
                    <td><code>{r.rollNumber}</code></td>
                    <td>{r.activityTitle || 'Activity Hub Activity'}</td>
                    <td><span className="pill submitted" style={{ fontSize: '11.5px' }}>{r.activityType || 'Workshop'}</span></td>
                    <td><small className="muted">{fmt(r.registeredAt)}</small></td>
                    <td>
                      {r.formData && Object.keys(r.formData).length > 0 ? (
                        <details style={{ fontSize: '12.5px' }}>
                          <summary style={{ cursor: 'pointer', color: '#2b4fd8' }}>View fields</summary>
                          <div style={{ marginTop: '0.25rem', paddingLeft: '0.5rem', background: '#f8fafc', borderRadius: '4px', padding: '4px 8px' }}>
                            {Object.entries(r.formData).map(([k, v]) => (
                              <div key={k}><b style={{ color: '#64748b' }}>{k}:</b> {String(v || '—')}</div>
                            ))}
                          </div>
                        </details>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

