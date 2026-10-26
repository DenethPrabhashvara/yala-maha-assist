export function PageTitle({ title, subtitle, action }) {
  return (
    <div className="row page-heading">
      <div><h1 className="pt">{title}</h1><p className="ps">{subtitle}</p></div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, detail }) {
  return <article className="card stat-card"><div className="k">{label}</div><div className="v">{value}</div><div className="cap">{detail}</div></article>;
}

export function Notice({ kind = 'info', children }) {
  return <div className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>;
}
