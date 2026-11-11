import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Calendar, MapPin, BadgePercent, Clock } from 'lucide-react';
import api, { errMsg } from '../../api';
import { useAuth } from '../../auth.jsx';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

const ACADEMIC_YEAR_OPTIONS = ['2026-27', '2025-26', '2024-25', '2027-28', '2023-24'];

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

  // Unified Registration Form State
  const [unifiedForm, setUnifiedForm] = useState({
    rollNumber: '',
    studentName: '',
    email: '',
    branch: '',
    gender: 'Male',
    phone: '',
    academicYear: '2026-27'
  });
  const [studentFound, setStudentFound] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const performLookup = async (roll) => {
    if (!roll || roll.trim().length < 5) return;
    const cleanRoll = roll.trim().toUpperCase();
    setIsLookingUp(true);
    setStudentFound(false);

    try {
      const res = await api.get(`/student/lookup/${encodeURIComponent(cleanRoll)}`);
      if (res.data?.success && res.data.student) {
        const student = res.data.student;
        const fetchedName = student.name || '';
        const fetchedEmail = student.email || '';
        const fetchedBranch = student.branch || student.department || '';
        const fetchedPhone = student.mobile || '';
        let fetchedGender = student.gender || 'Male';
        if (fetchedGender.toUpperCase() === 'M' || fetchedGender.toUpperCase() === 'MALE') fetchedGender = 'Male';
        else if (fetchedGender.toUpperCase() === 'F' || fetchedGender.toUpperCase() === 'FEMALE') fetchedGender = 'Female';
        else fetchedGender = 'Male';

        setUnifiedForm(prev => ({
          ...prev,
          studentName: fetchedName || prev.studentName,
          email: fetchedEmail || prev.email,
          branch: fetchedBranch || prev.branch,
          phone: fetchedPhone || prev.phone,
          gender: fetchedGender || prev.gender,
        }));
        setStudentFound(true);
      }
    } catch (e) {
      if (user && user.rollNumber === cleanRoll) {
        setUnifiedForm(prev => ({
          ...prev,
          studentName: user.name || prev.studentName,
          email: user.email || prev.email,
          branch: user.department || prev.branch,
        }));
        setStudentFound(true);
      }
    } finally {
      setIsLookingUp(false);
    }
  };

  useEffect(() => {
    api.get(`/student/activities/${id}`)
      .then((r) => {
        setActivity(r.data);
        if (r.data.isUnified) {
          const initRoll = user?.rollNumber || '';
          setUnifiedForm({
            rollNumber: initRoll,
            studentName: user?.name || '',
            email: user?.email || '',
            branch: user?.department || 'CSE',
            gender: 'Male',
            phone: '',
            academicYear: r.data.academicYear || '2026-27'
          });
          if (initRoll && initRoll.length >= 5) {
            performLookup(initRoll);
          }
        } else {
          const init = {};
          (r.data.fields || []).forEach((f) => {
            init[f.key] = '';
          });
          setFormData(init);
        }
      })
      .catch((e) => setErr(errMsg(e)))
      .finally(() => setLoading(false));
  }, [id, user]);

  const handleChange = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErr('');
    try {
      if (activity.isUnified) {
        if (!unifiedForm.rollNumber.trim()) {
          setErr('Employee ID / Roll number is required');
          setSubmitting(false);
          return;
        }
        if (!unifiedForm.studentName.trim()) {
          setErr('Student Name is required');
          setSubmitting(false);
          return;
        }
        await api.post(`/student/register/${id}`, {
          rollNumber: unifiedForm.rollNumber.trim().toUpperCase(),
          studentName: unifiedForm.studentName.trim(),
          email: unifiedForm.email.trim(),
          phone: unifiedForm.phone.trim(),
          branch: unifiedForm.branch.trim(),
          gender: unifiedForm.gender,
          academicYear: unifiedForm.academicYear
        });
      } else {
        await api.post(`/student/register/${id}`, { formData });
      }
      setSuccess('You have successfully registered for this activity!');
      setTimeout(() => nav('/my-registrations'), 1800);
    } catch (x) {
      if (!x.response) {
        try {
          await new Promise((r) => setTimeout(r, 600));
          const check = await api.get(`/student/activities/${id}`);
          if (check.data?.isRegistered) {
            setSuccess('You have successfully registered for this activity!');
            setTimeout(() => nav('/my-registrations'), 1800);
            return;
          }
        } catch {}
        setErr('Unable to reach backend server (http://localhost:5000). Please try again in a moment.');
      } else {
        setErr(errMsg(x));
      }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
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
          {activity.approvalNumber && (
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
              {activity.approvalNumber}
            </span>
          )}
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

        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#64748b', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Calendar size={14} /> {fmt(activity.startDate)}{activity.endDate ? ` – ${fmt(activity.endDate)}` : ''}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <MapPin size={14} /> {activity.venue || activity.department}
          </span>
          {activity.fee && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, color: activity.fee.hasFee ? '#b45309' : '#047857' }}>
              <BadgePercent size={14} /> {activity.fee.hasFee ? `₹${activity.fee.amount}` : 'Free Registration'}
            </span>
          )}
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
      ) : activity.isUnified ? (
        /* Unified Portal Activity Registration Form (Exact layout matching Unified Portal) */
        <form onSubmit={submit} className="card" style={{ padding: '1.75rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Event Title (Bold & Centered) */}
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', textAlign: 'center', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.3 }}>
            {activity.title}
          </h2>

          {/* Centered "Registration Information" Separator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', margin: '0.25rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ padding: '0 1rem', fontSize: '13px', fontWeight: 600, color: '#475569', letterSpacing: '0.4px' }}>
              Registration Information
            </span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* Field 1: Employee ID / Roll number */}
          <div>
            <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem', fontSize: '14px' }}>
              Employee ID / Roll number <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Enter employee ID or roll number"
              value={unifiedForm.rollNumber}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setUnifiedForm(prev => ({ ...prev, rollNumber: val }));
                setStudentFound(false);
                if (val.trim().length >= 5) {
                  performLookup(val);
                }
              }}
              style={{
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                padding: '10px 14px',
                fontSize: '15px',
                fontWeight: 600,
                color: '#0f172a'
              }}
            />
            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
              {isLookingUp ? '🔍 Verifying details...' : studentFound ? '✓ Verified and details auto-populated' : 'Enter employee ID or roll number to auto-populate'}
            </span>
          </div>

          {/* Row 2: Name & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem', fontSize: '14px' }}>
                Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter full name"
                value={unifiedForm.studentName}
                onChange={(e) => setUnifiedForm(prev => ({ ...prev, studentName: e.target.value }))}
                style={{ borderRadius: '12px', border: '1px solid #cbd5e1', padding: '10px 12px' }}
              />
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
                Enter full name (auto-populates if available)
              </span>
            </div>

            <div>
              <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem', fontSize: '14px' }}>
                Email <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                required
                placeholder="Enter email address"
                value={unifiedForm.email}
                onChange={(e) => setUnifiedForm(prev => ({ ...prev, email: e.target.value }))}
                style={{ borderRadius: '12px', border: '1px solid #cbd5e1', padding: '10px 12px' }}
              />
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
                Enter email address
              </span>
            </div>
          </div>

          {/* Row 3: Branch & Gender */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem', fontSize: '14px' }}>
                Branch <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter branch (e.g. CSE,"
                value={unifiedForm.branch}
                onChange={(e) => setUnifiedForm(prev => ({ ...prev, branch: e.target.value }))}
                style={{ borderRadius: '12px', border: '1px solid #cbd5e1', padding: '10px 12px' }}
              />
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
                Enter branch (auto-populates if available)
              </span>
            </div>

            <div>
              <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem', fontSize: '14px' }}>
                Gender <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={unifiedForm.gender}
                onChange={(e) => setUnifiedForm(prev => ({ ...prev, gender: e.target.value }))}
                style={{ borderRadius: '12px', border: '1px solid #cbd5e1', padding: '10px 12px', width: '100%' }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
                Select gender
              </span>
            </div>
          </div>

          {/* Row 4: Phone number */}
          <div>
            <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem', fontSize: '14px' }}>
              Phone number
            </label>
            <input
              type="text"
              placeholder="Enter phone number"
              value={unifiedForm.phone}
              onChange={(e) => setUnifiedForm(prev => ({ ...prev, phone: e.target.value }))}
              style={{ borderRadius: '12px', border: '1px solid #cbd5e1', padding: '10px 12px' }}
            />
            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
              Enter phone number
            </span>
          </div>

          {/* Row 5: Academic Year (Select dropdown) */}
          <div>
            <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem', fontSize: '14px' }}>
              Academic Year <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={unifiedForm.academicYear}
              onChange={(e) => setUnifiedForm(prev => ({ ...prev, academicYear: e.target.value }))}
              style={{ borderRadius: '12px', border: '1px solid #cbd5e1', padding: '10px 12px', width: '100%' }}
            >
              {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
              Select academic year for your registration
            </span>
          </div>

          {/* Eligibility & Fee summary */}
          {activity.fee?.hasFee ? (
            <div className="alert warn" style={{ margin: 0, fontSize: '13.5px' }}>
              <b>Registration Fee:</b> ₹{activity.fee.amount}
            </div>
          ) : (
            <div className="alert ok" style={{ margin: 0, fontSize: '13.5px' }}>
              <b>Free Registration:</b> No registration fee required for this activity.
            </div>
          )}

          {activity.eligibility && (
            <div style={{ background: '#f8fafc', padding: '0.65rem 0.9rem', borderRadius: '10px', fontSize: '12.5px', color: '#475569', border: '1px solid #e2e8f0' }}>
              <b>Eligibility Criteria:</b> Applicable for{' '}
              {[
                activity.eligibility.applicableBoys && 'Boys',
                activity.eligibility.applicableGirls && 'Girls',
                activity.eligibility.applicableHostlers && 'Hostlers'
              ].filter(Boolean).join(', ') || 'All Students'}
            </div>
          )}

          {err && <div className="alert err" style={{ margin: 0 }}>{err}</div>}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button type="button" className="btn ghost" onClick={() => nav(-1)}>
              Cancel
            </button>
            <button className="btn primary" disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
              {submitting ? 'Submitting Registration…' : 'Confirm Registration'}
            </button>
          </div>
        </form>
      ) : (
        /* Local Activity Registration Form */
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
