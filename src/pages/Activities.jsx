import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, Plus, Search } from 'lucide-react';
import api, { errMsg } from '../api';
import { useMeta } from '../meta.js';
import { DateTile, Empty, StatusPill, TypeTag } from '../components/ui.jsx';

export default function Activities() {
  const meta = useMeta();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState('');
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');
  const type = sp.get('type') || '', status = sp.get('status') || '', ay = sp.get('ay') || '';
  const setParam = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n); };

  useEffect(() => {
    const t = setTimeout(() => {
      api.get('/activities', { params: { type, status, academicYear: ay, q } }).then((r) => setItems(r.data)).catch((e) => setErr(errMsg(e)));
    }, 200);
    return () => clearTimeout(t);
  }, [type, status, ay, q]);

  const exportXlsx = async () => {
    try {
      const r = await api.get(`/export/${type}`, { params: { academicYear: ay }, responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(r.data); a.download = `${type}_${ay || 'all'}.xlsx`; a.click();
    } catch (e) { setErr(errMsg(e)); }
  };
  if (!meta) return <div className="splash">Loading…</div>;

  return (
    <>
      <header className="pagehead">
        <div><h1>Activities</h1><p className="muted">Workshops, lectures, visits and events in one place</p></div>
        <Link to="/activities/new" className="btn primary"><Plus size={18} />New activity</Link>
      </header>
      <div className="toolbar">
        <label className="search"><Search size={16} /><input placeholder="Search by title" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <select value={type} onChange={(e) => setParam('type', e.target.value)}><option value="">All types</option>{Object.entries(meta.types).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}</select>
        <select value={status} onChange={(e) => setParam('status', e.target.value)}><option value="">All statuses</option>{['draft', 'submitted', 'approved', 'rejected'].map((s) => <option key={s}>{s}</option>)}</select>
        <select value={ay} onChange={(e) => setParam('ay', e.target.value)}><option value="">All years</option>{meta.academicYears.map((y) => <option key={y} value={y}>AY {y}</option>)}</select>
        <button className="btn ghost" disabled={!type} onClick={exportXlsx} title={type ? 'Download approved activities as an Excel form' : 'Choose a type to export its form'}><Download size={16} />Export form</button>
      </div>
      {err && <div className="alert err">{err}</div>}
      {!items ? <div className="splash">Loading…</div> : items.length === 0 ? (
        <Empty title="No activities match these filters">Clear a filter or add a new activity.</Empty>
      ) : (
        <div className="card list">
          {items.map((a) => (
            <Link key={a._id} to={`/activities/${a._id}`} className="row" style={{ '--c': meta.types[a.type]?.color }}>
              <DateTile date={a.startDate} color={meta.types[a.type]?.color} />
              <div className="rowmain"><b>{a.title}</b><span><TypeTag meta={meta.types[a.type]} /><small className="muted"> {a.department} · AY {a.academicYear}</small></span></div>
              <span className="muted count">{a.participantCount} students</span>
              <StatusPill status={a.status} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
