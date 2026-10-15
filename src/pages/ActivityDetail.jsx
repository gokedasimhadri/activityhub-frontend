import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Pencil, Send, Trash2, X } from 'lucide-react';
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

  const load = useCallback(() => api.get(`/activities/${id}`).then((r) => setA(r.data)).catch((e) => setMsg({ err: errMsg(e) })), [id]);
  useEffect(() => { load(); }, [load]);
  const run = async (fn, ok) => { try { const r = await fn(); if (ok) setMsg({ ok: typeof ok === 'function' ? ok(r) : ok }); await load(); } catch (e) { setMsg({ err: errMsg(e) }); } };

  if (msg?.err && !a) return <div className="alert err">{msg.err}</div>;
  if (!a || !meta) return <div className="splash">Loading…</div>;
  const t = meta.types[a.type];
  const canReview = ['hod', 'admin'].includes(user.role) && a.status === 'submitted';

  const addStudents = () => {
    const rows = paste.split('\n').map((l) => l.split(/[,\t]/).map((s) => s.trim())).filter((r) => r[0]).map(([rollNumber, name, recognition]) => ({ rollNumber, name, recognition }));
    if (!rows.length) return setMsg({ err: 'Paste at least one roll number' });
    run(() => api.post(`/activities/${id}/participants`, { participants: rows }), (r) => `${r.data.added} added${r.data.skipped ? `, ${r.data.skipped} skipped (already listed)` : ''}`).then(() => setPaste(''));
  };

  return (
    <>
      <header className="detailhead" style={{ '--c': t.color }}>
        <DateTile date={a.startDate} color={t.color} big />
        <div className="grow">
          <h1>{a.title}</h1>
          <div className="metaline"><TypeTag meta={t} /><StatusPill status={a.status} /><span className="muted">{a.department} · AY {a.academicYear}</span></div>
        </div>
        <div className="actions">
          {a.canEdit && <Link to={`/activities/${id}/edit`} className="btn ghost"><Pencil size={16} />Edit</Link>}
          {a.canEdit && ['draft', 'rejected'].includes(a.status) && <button className="btn primary" onClick={() => run(() => api.post(`/activities/${id}/submit`), 'Sent for approval')}><Send size={16} />Submit for approval</button>}
          {a.canEdit && <button className="btn danger" onClick={() => window.confirm('Delete this activity and its participants?') && run(() => api.delete(`/activities/${id}`)).then(() => nav('/activities'))}><Trash2 size={16} />Delete</button>}
        </div>
      </header>

      {msg && <div className={`alert ${msg.err ? 'err' : 'ok'}`}>{msg.err || msg.ok}</div>}
      {a.status === 'rejected' && a.reviewNote && <div className="alert err">Sent back by reviewer: {a.reviewNote}</div>}
      {canReview && (
        <div className="card review">
          <h3>Review this activity</h3>
          <input placeholder="Note for the faculty (required if sending back)" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn good" onClick={() => run(() => api.post(`/activities/${id}/review`, { action: 'approve', note }), 'Approved')}><Check size={16} />Approve</button>
          <button className="btn danger" onClick={() => note.trim() ? run(() => api.post(`/activities/${id}/review`, { action: 'reject', note }), 'Sent back to faculty') : setMsg({ err: 'Add a note so the faculty knows what to fix' })}><X size={16} />Send back</button>
        </div>
      )}

      <div className="card facts">
        <div><span>Date</span><b>{fmt(a.startDate)}{a.endDate ? ` to ${fmt(a.endDate)}` : ''}</b></div>
        {t.fields.map((f) => <div key={f.key}><span>{f.label}</span><b>{a.details?.[f.key] || '—'}</b></div>)}
        <div><span>Entered by</span><b>{a.createdBy?.name}</b></div>
        <div><span>University form</span><b>{t.form}</b></div>
        {a.description && <div className="span2"><span>Description</span><p>{a.description}</p></div>}
      </div>

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
