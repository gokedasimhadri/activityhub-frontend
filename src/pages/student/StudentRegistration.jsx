import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Calendar, MapPin } from 'lucide-react';
import api, { errMsg } from '../../api';
import { useAuth } from '../../auth.jsx';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export default function StudentRegistration() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [activity, setActivity] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get(`/student/activities/${id}`)
      .then((r) => {
        setActivity(r.data);
        const init = {};
        (r.data.fields || []).forEach((f) => {
          init[f.key] = '';
        });
        setFormData(init);
      })
      .catch((e) => setErr(errMsg(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErr('');
    try {
      await api.post(`/student/register/${id}`, { formData });
      setSuccess('You have successfully registered for this activity!');
      setTimeout(() => nav('/my-registrations'), 1800);
    } catch (x) {
      setErr(errMsg(x));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="splash">Loading activity details…</div>;
  if (err && !activity) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
        <div className="alert err">{err}</div>
        <button className="btn ghost" onClick={() => nav('/activities')}>
          <ArrowLeft size={16} /> Back to Activities
        </button>
      </div>
    );
  }
  if (!activity) return null;

  const color = activity.typeInfo?.color || '#2b4fd8';

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <button
        type="button"
        className="btn ghost"
        onClick={() => nav(-1)}
        style={{ marginBottom: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Activity Summary Card */}
      <div
        className="card"
        style={{
          borderLeft: `5px solid ${color}`,
          marginBottom: '1.5rem',
          padding: '1.25rem'
        }}
      >
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
            {activity.typeInfo?.label || activity.type}
          </span>
          <span className="muted" style={{ fontSize: '13px' }}>
            · {activity.department} · {activity.academicYear}
          </span>
        </div>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#0f172a' }}>
          {activity.title}
        </h2>

        {activity.description && (
          <p style={{ margin: '0 0 0.75rem', color: '#475569', fontSize: '0.92rem' }}>
            {activity.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Calendar size={14} /> {fmt(activity.startDate)}{activity.endDate ? ` – ${fmt(activity.endDate)}` : ''}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <MapPin size={14} /> {activity.department}
          </span>
        </div>
      </div>

      {activity.isRegistered ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <CheckCircle2 size={40} style={{ color: '#16a34a', margin: '0 auto 0.75rem' }} />
          <h3 style={{ margin: '0 0 0.5rem' }}>You Are Already Registered</h3>
          <p className="muted" style={{ margin: '0 0 1.25rem' }}>
            You have already submitted your participation registration for this activity.
          </p>
          <Link to="/my-registrations" className="btn primary">
            View My Registrations
          </Link>
        </div>
      ) : success ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <CheckCircle2 size={40} style={{ color: '#16a34a', margin: '0 auto 0.75rem' }} />
          <h3 style={{ margin: '0 0 0.5rem' }}>Registration Successful!</h3>
          <p className="muted" style={{ margin: '0 0 1.25rem' }}>{success}</p>
          <Link to="/my-registrations" className="btn primary">
            Go to My Registrations
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="loginform" style={{ boxShadow: 'none', padding: 0 }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.15rem', color: '#1e293b' }}>
            Registration Form
          </h3>

          {/* Student Info Box */}
          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid #e2e8f0' }}>
            <div><b style={{ color: '#475569' }}>Student Name:</b> {user?.name}</div>
            <div><b style={{ color: '#475569' }}>Roll Number:</b> <code>{user?.rollNumber || user?.email}</code></div>
          </div>

          {(activity.fields || []).map((field) => (
            <label key={field.key}>
              {field.label}
              {field.type === 'select' ? (
                <select
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                >
                  <option value="">Select option…</option>
                  {(field.options || []).map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                />
              )}
            </label>
          ))}

          {err && <div className="alert err">{err}</div>}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn ghost" onClick={() => nav(-1)}>
              Cancel
            </button>
            <button className="btn primary" disabled={submitting} style={{ flex: 1 }}>
              {submitting ? 'Registering…' : 'Submit Registration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
