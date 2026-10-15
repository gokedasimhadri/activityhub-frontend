export const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
export function DateTile({ date, color, big }) {
  const d = new Date(date);
  return (
    <div className={`dt ${big ? 'big' : ''}`} style={{ '--c': color }}>
      <b>{String(d.getDate()).padStart(2, '0')}</b>
      <span>{d.toLocaleDateString('en-GB', { month: 'short' })}</span>
    </div>
  );
}

export const StatusPill = ({ status }) => <span className={`pill ${status}`}>{status}</span>;
export const TypeTag = ({ meta }) => meta ? <span className="tag"><i style={{ background: meta.color }} />{meta.label}</span> : null;
export const Empty = ({ title, children }) => <div className="empty"><h3>{title}</h3><p>{children}</p></div>;
