import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, CheckCircle2, ArrowRight, Search, Clock } from 'lucide-react';
import api, { errMsg } from '../../api';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export default function StudentActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [query, setQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  useEffect(() => {
    api.get('/student/activities')
      .then((r) => setActivities(r.data))
      .catch((e) => setErr(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  const departments = ['All', ...new Set(activities.map((a) => a.department).filter(Boolean))];

  const filtered = activities.filter((a) => {
    const matchesQuery = !query.trim() ||
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(query.toLowerCase()) ||
      (a.activityType || '').toLowerCase().includes(query.toLowerCase());
    const matchesDept = selectedDept === 'All' || a.department === selectedDept;
    return matchesQuery && matchesDept;
  });

  if (loading) return <div className="splash">Loading available activities…</div>;
  if (err) return <div className="alert err">{err}</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <header style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Available Activities
        </h1>
        <p className="muted" style={{ margin: '0.4rem 0 0', fontSize: '0.95rem' }}>
          Explore workshops, technical visits, guest lectures, and competitions open for student participation.
        </p>
      </header>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search activities by title, keyword, or type..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.4rem' }}
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          style={{ minWidth: '150px' }}
        >
          {departments.map((d) => (
            <option key={d} value={d}>
              {d === 'All' ? 'All Departments' : d}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p className="muted" style={{ fontSize: '1.1rem', margin: 0 }}>
            {activities.length === 0
              ? 'No activities are currently published or open for registration.'
              : 'No activities match your search filters.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filtered.map((a) => {
            const color = a.typeInfo?.color || '#2b4fd8';
            return (
              <div
                key={a._id}
                className="card"
                style={{
                  borderLeft: `5px solid ${color}`,
                  padding: '1.25rem 1.5rem',
                  transition: 'box-shadow 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      {a.approvalNumber && (
                        <span
                          style={{
                            backgroundColor: '#f0fdf4',
                            color: '#166534',
                            border: '1px solid #86efac',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontFamily: 'monospace'
                          }}
                        >
                          {a.approvalNumber}
                        </span>
                      )}
                      {a.fee && (
                        <span
                          style={{
                            backgroundColor: a.fee.hasFee ? '#fffbeb' : '#ecfdf5',
                            color: a.fee.hasFee ? '#b45309' : '#047857',
                            border: `1px solid ${a.fee.hasFee ? '#fde68a' : '#a7f3d0'}`,
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          {a.fee.hasFee ? `₹${a.fee.amount}` : 'Free'}
                        </span>
                      )}
                      <span className="muted" style={{ fontSize: '13px' }}>
                        · {a.department} · {a.academicYear}
                      </span>
                      {a.registrationCount > 0 && (
                        <span className="muted" style={{ fontSize: '12px' }}>
                          · {a.registrationCount} student{a.registrationCount === 1 ? '' : 's'} registered
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                      {a.title}
                    </h3>
                  </div>

                  <div>
                    {a.isRegistered ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          backgroundColor: '#ecfdf5',
                          color: '#065f46',
                          border: '1px solid #a7f3d0',
                          padding: '0.4rem 0.85rem',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 600
                        }}
                      >
                        <CheckCircle2 size={16} /> Registered
                      </span>
                    ) : (
                      <Link
                        to={`/activities/${a._id}/register`}
                        className="btn primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                      >
                        Register Now <ArrowRight size={15} />
                      </Link>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={15} style={{ color: '#94a3b8' }} />
                    <span>{fmt(a.startDate)}{a.endDate ? ` – ${fmt(a.endDate)}` : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={15} style={{ color: '#94a3b8' }} />
                    <span>{a.venue || `${a.department} Department`}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={15} style={{ color: '#94a3b8' }} />
                    <span>Target: {a.targetAudience}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
