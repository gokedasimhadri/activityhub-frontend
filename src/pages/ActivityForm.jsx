import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { currentYear, useMeta } from '../meta.js';

const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export default function ActivityForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const meta = useMeta();
  const [f, setF] = useState({ type: '', title: '', academicYear: currentYear(), startDate: '', endDate: '', description: '', details: {} });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/activities/${id}`).then((r) => setF({ ...r.data, startDate: day(r.data.startDate), endDate: day(r.data.endDate), details: r.data.details || {} })).catch((e) => setErr(errMsg(e)));
  }, [id]);
  if (!meta) return <div className="splash">Loading…</div>;

  const t = meta.types[f.type];
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setDetail = (k) => (e) => setF({ ...f, details: { ...f.details, [k]: e.target.value } });
  const save = async (e) => {
    e.preventDefault(); setErr('');
    if (!f.type) return setErr('Choose an activity type first');
    setBusy(true);
    try {
      const body = { type: f.type, title: f.title, academicYear: f.academicYear, startDate: f.startDate, endDate: f.endDate, description: f.description, details: f.details };
      const r = id ? await api.put(`/activities/${id}`, body) : await api.post('/activities', body);
      nav(`/activities/${r.data._id}`);
    } catch (x) { setErr(errMsg(x)); setBusy(false); }
  };

  return (
    <form onSubmit={save} className="formpage">
      <header className="pagehead"><div><h1>{id ? 'Edit activity' : 'New activity'}</h1><p className="muted">Fill in what the university form asks for. You can add students on the next page.</p></div></header>
      <div className="card">
        <h3>What kind of activity is it?</h3>
        <div className="types">
          {Object.entries(meta.types).map(([k, v]) => (
            <button type="button" key={k} disabled={!!id} className={f.type === k ? 'sel' : ''} style={{ '--c': v.color }} onClick={() => setF({ ...f, type: k, details: {} })}>{v.label}</button>
          ))}
        </div>
        {t && <p className="muted hint">Reported in {t.form}</p>}
      </div>
      {t && (
        <div className="card fields">
          <label className="span2">Name of the {t.label.toLowerCase()}<input required value={f.title} onChange={set('title')} /></label>
          <label>Academic year<select value={f.academicYear} onChange={set('academicYear')}>{meta.academicYears.map((y) => <option key={y}>{y}</option>)}</select></label>
          <label>Start date<input type="date" required value={f.startDate} onChange={set('startDate')} /></label>
          <label>End date (if more than one day)<input type="date" min={f.startDate} value={f.endDate} onChange={set('endDate')} /></label>
          {t.fields.map((fld) => (
            <label key={fld.key}>{fld.label}
              {fld.type === 'select'
                ? <select value={f.details[fld.key] || ''} onChange={setDetail(fld.key)}><option value="">Select…</option>{fld.options.map((o) => <option key={o}>{o}</option>)}</select>
                : <input type={fld.type} value={f.details[fld.key] ?? ''} onChange={setDetail(fld.key)} />}
            </label>
          ))}
          <label className="span2">Description (optional)<textarea rows={3} value={f.description} onChange={set('description')} /></label>
        </div>
      )}
      {err && <div className="alert err">{err}</div>}
      <div className="actions">
        <button className="btn primary" disabled={busy}>{id ? 'Save changes' : 'Create activity'}</button>
        <button type="button" className="btn ghost" onClick={() => nav(-1)}>Cancel</button>
      </div>
    </form>
  );
}
