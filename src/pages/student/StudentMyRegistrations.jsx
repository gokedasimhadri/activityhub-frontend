import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, FileText } from 'lucide-react';
import api, { errMsg } from '../../api';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export default function StudentMyRegistrations() {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/student/my-registrations')
      .then((r) => setRegs(Array.isArray(r.data) ? r.data : []))
      .catch((e) => setErr(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="splash">Loading your registrations…</div>;
  if (err) return <div className="alert err">{err}</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <header style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          My Registrations
        </h1>
        <p className="muted" style={{ margin: '0.4rem 0 0', fontSize: '0.95rem' }}>
          Overview of all activities you have registered for in the Activity Hub.
        </p>
      </header>

      {regs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <FileText size={44} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>No Registrations Found</h3>
          <p className="muted" style={{ margin: '0 auto 1.5rem', maxWidth: '400px' }}>
            You haven't registered for any university activities yet. Check out the available activities and join!
          </p>
          <Link to="/activities" className="btn primary">
            Explore Available Activities
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {regs.map((r) => {
            const a = r.activity || {};
            const t = r.typeInfo || {};
            const color = t.color || '#2b4fd8';

            return (
              <div
                key={r._id}
                className="card"
                style={{
                  borderLeft: `5px solid ${color}`,
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span
                        style={{
                          backgroundColor: `${color}18`,
                          color: color,
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        {t.label || a.activityType || a.type}
                      </span>
                      <span className="muted" style={{ fontSize: '13px' }}>
                        · {a.department}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                      {a.title || 'Activity'}
                    </h3>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      backgroundColor: '#ecfdf5',
                      color: '#065f46',
                      border: '1px solid #a7f3d0',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    <CheckCircle2 size={14} /> Registered
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#64748b' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} /> Event: {fmt(a.startDate)}{a.endDate ? ` – ${fmt(a.endDate)}` : ''}
                  </span>
                  <span style={{ color: '#94a3b8' }}>
                    Registered on: {fmt(r.registeredAt)}
                  </span>
                </div>

                {r.formData && Object.keys(r.formData).length > 0 && (
                  <details style={{ marginTop: '0.25rem', fontSize: '0.88rem' }}>
                    <summary style={{ cursor: 'pointer', color: '#2b4fd8', fontWeight: 500 }}>
                      View Submitted Information
                    </summary>
                    <div
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '0.5rem'
                      }}
                    >
                      {Object.entries(r.formData).map(([k, v]) => (
                        <div key={k}>
                          <span style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                            {k.replace(/([A-Z])/g, ' $1')}:
                          </span>{' '}
                          <b style={{ color: '#1e293b' }}>{String(v || '—')}</b>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
