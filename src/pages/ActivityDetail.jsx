import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Pencil, Send, Trash2, X, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import api, { errMsg } from '../api';
import { useAuth } from '../auth.jsx';
import { useMeta } from '../meta.js';
import { DateTile, StatusPill, TypeTag, fmt } from '../components/ui.jsx';

export default function ActivityDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const meta = useMeta();
  const [a, setA] = useState(null);
  const [msg, setMsg] = useState(null);
  const [paste, setPaste] = useState('');
  const [note, setNote] = useState('');
  const [studentRegs, setStudentRegs] = useState(null);
  const [regsLoading, setRegsLoading] = useState(false);

  const load = useCallback(() => api.get(`/activities/${id}`).then((r) => setA(r.data)).catch((e) => setMsg({ err: errMsg(e) })), [id]);
  useEffect(() => { load(); }, [load]);
  const run = async (fn, ok) => { try { const r = await fn(); if (ok) setMsg({ ok: typeof ok === 'function' ? ok(r) : ok }); await load(); } catch (e) { setMsg({ err: errMsg(e) }); } };

  const loadStudentRegs = () => {
    setRegsLoading(true);
    api.get(`/activities/${id}/student-registrations`)
      .then((r) => setStudentRegs(r.data))
      .catch((e) => setMsg({ err: errMsg(e) }))
      .finally(() => setRegsLoading(false));
  };

  const toggleEnable = () => run(() => api.patch(`/activities/${id}/toggle-enable`), (r) => `Activity ${r.data.isEnabled ? 'enabled' : 'disabled'} for students`);
  const setAudience = (targetAudience) => run(() => api.patch(`/activities/${id}/audience`, { targetAudience }), `Audience set to ${targetAudience}`);

  if (msg?.err && !a) return <div className="alert err">{msg.err}</div>;
  if (!a || !meta) return <div className="splash">Loading…</div>;
  const t = meta.types[a.type];
  const canReview = ['hod', 'admin'].includes(user.role) && a.status === 'submitted';
  const canManageStudentReg = ['hod', 'admin'].includes(user.role) || String(a.createdBy?._id || a.createdBy) === String(user.id);

  const addStudents = () => {
    const rows = paste.split('\n').map((l) => l.split(/[,	]/).map((s) => s.trim())).filter((r) => r[0]).map(([rollNumber, name, recognition]) => ({ rollNumber, name, recognition }));
    if (!rows.length) return setMsg({ err: 'Paste at least one roll number' });
    run(() => api.post(`/activities/${id}/participants`, { participants: rows }), (r) => `${r.data.added} added${r.data.skipped ? `, ${r.data.skipped} skipped (already listed)` : ''}`).then(() => setPaste(''));
  };

  return (
    <>
      <header className="pagehead">
        <DateTile date={a.startDate} />
        <div>
          <div className="meta">
            <TypeTag type={a.type} />
            <StatusPill status={a.status} />
            <span className="muted">{a.department} · {a.academicYear}</span>
            {a.isEnabled && <span className="pill ok" style={{ fontSize: '11px' }}>Open for Registration</span>}
          </div>
          <h1>{a.title}</h1>
        </div>
        <div className="actions">
          {a.canEdit && (
            <>
              <Link to={`/activities/${id}/edit`} className="btn ghost"><Pencil size={16} />Edit</Link>
              <button className="btn primary" onClick={() => run(() => api.post(`/activities/${id}/submit`), 'Submitted for HOD review')}><Send size={16} />Submit for review</button>
              <button className="icon danger" title="Delete" aria-label="Delete" onClick={() => { if (confirm('Delete this activity?')) run(() => api.delete(`/activities/${id}`)).then(() => nav('/activities')); }}><Trash2 size={16} /></button>
            </>
          )}
        </div>
      </header>

      {msg?.err && <div className="alert err">{msg.err}</div>}
      {msg?.ok && <div className="alert ok">{msg.ok}</div>}
      {a.reviewNote && <div className="alert warn"><b>Review note:</b> {a.reviewNote}</div>}

      {/* Admin / HOD / Creator: Student Registration Controls */}
      {canManageStudentReg && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div>
            <b>Student Portal Registration</b>
            <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
              Control whether students can discover and register for this activity.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ margin: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Audience:
              <select
                value={a.targetAudience || 'Both'}
                onChange={(e) => setAudience(e.target.value)}
                style={{ padding: '0.35rem 0.5rem', borderRadius: '4px' }}
              >
                <option value="Both">Both (Students & Faculty)</option>
                <option value="Students">Students Only</option>
                <option value="Faculty">Faculty Only</option>
              </select>
            </label>

            <button
              className={`btn ${a.isEnabled ? 'danger' : 'primary'}`}
              onClick={toggleEnable}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {a.isEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {a.isEnabled ? 'Disable Registration' : 'Enable Registration'}
            </button>
          </div>
        </div>
      )}

      {canReview && (
        <div className="card reviewbox">
          <div>
            <b>Review this submission</b>
            <p className="muted">Approve to make it official and include it in university reports, or send it back with a note.</p>
          </div>
          <input placeholder="Add a note if sending back (optional for approval)" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn ok" onClick={() => run(() => api.post(`/activities/${id}/review`, { action: 'approve', note }), 'Activity approved')}><Check size={16} />Approve</button>
          <button className="btn danger" onClick={() => note.trim() ? run(() => api.post(`/activities/${id}/review`, { action: 'reject', note }), 'Sent back to faculty') : setMsg({ err: 'Add a note so the faculty knows what to fix' })}><X size={16} />Send back</button>
        </div>
      )}

      <div className="card facts">
        <div><span>Date</span><b>{fmt(a.startDate)}{a.endDate ? ` to ${fmt(a.endDate)}` : ''}</b></div>
        {t.fields.map((f) => <div key={f.key}><span>{f.label}</span><b>{a.details?.[f.key] || '—'}</b></div>)}
        <div><span>Entered by</span><b>{a.createdBy?.name}</b></div>
        <div><span>University form</span><b>{t.form}</b></div>
        <div><span>Target Audience</span><b>{a.targetAudience || 'Both'}</b></div>
        <div><span>Student Registrations</span><b>{a.studentRegistrationCount || 0}</b></div>
        {a.description && <div className="span2"><span>Description</span><p>{a.description}</p></div>}
      </div>

      {/* Online Student Registrations List */}
      <div className="card">
        <div className="listhead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Online Student Registrations ({a.studentRegistrationCount || 0})</h3>
          <button className="btn ghost" onClick={loadStudentRegs} disabled={regsLoading}>
            <Users size={16} /> {regsLoading ? 'Loading…' : (studentRegs === null ? 'View Registrations' : 'Refresh')}
          </button>
        </div>

        {studentRegs !== null && (
          studentRegs.length === 0 ? (
            <p className="muted pad">No students have self-registered online for this activity yet.</p>
          ) : (
            <div className="tablewrap" style={{ marginTop: '0.75rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Roll Number</th>
                    <th>Name</th>
                    <th>Registered At</th>
                    <th>Form Responses</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRegs.map((r, i) => (
                    <tr key={r._id || i}>
                      <td>{i + 1}</td>
                      <td><b><code>{r.rollNumber}</code></b></td>
                      <td>{r.studentName || '—'}</td>
                      <td><small className="muted">{fmt(r.registeredAt)}</small></td>
                      <td>
                        {r.formData && Object.keys(r.formData).length > 0 ? (
                          <div style={{ fontSize: '12px' }}>
                            {Object.entries(r.formData).map(([k, v]) => (
                              <span key={k} style={{ marginRight: '0.75rem' }}>
                                <b style={{ color: '#64748b' }}>{k}:</b> {String(v)}
                              </span>
                            ))}
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Manual Participants List (Legacy/Admin Entered) */}
      <div className="card">
        <div className="listhead"><h3>Students who took part ({a.participants.length})</h3></div>
        {a.canEdit && (
          <div className="addbox">
            <textarea rows={4} placeholder={'One student per line:\n22A91A0501, Anitha, First prize\n22A91A0502, Rahul'} value={paste} onChange={(e) => setPaste(e.target.value)} />
            <button className="btn primary" onClick={addStudents}>Add students</button>
          </div>
        )}
        {a.participants.length === 0 ? <p className="muted pad">No students added yet.</p> : (
          <div className="tablewrap"><table>
            <thead><tr><th>#</th><th>Roll number</th><th>Name</th><th>Recognition</th>{a.canEdit && <th />}</tr></thead>
            <tbody>{a.participants.map((p, i) => (
              <tr key={p._id}><td>{i + 1}</td><td>{p.rollNumber}</td><td>{p.name}</td><td>{p.recognition}</td>
                {a.canEdit && <td><button className="icon" aria-label="Remove student" onClick={() => run(() => api.delete(`/activities/${id}/participants/${p._id}`))}><X size={16} /></button></td>}</tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
