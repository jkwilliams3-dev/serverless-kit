const nodes = [
  { id: 'user',    label: 'User',        sub: 'Browser / Mobile', x: 60,  y: 160, color: '#3b82f6', icon: '👤' },
  { id: 'cf',      label: 'CloudFront',  sub: 'CDN + HTTPS',       x: 240, y: 60,  color: '#f59e0b', icon: '⚡' },
  { id: 's3',      label: 'S3 Bucket',   sub: 'Static Assets',     x: 430, y: 60,  color: '#f59e0b', icon: '🪣' },
  { id: 'agw',     label: 'API Gateway', sub: 'REST API',          x: 240, y: 260, color: '#8b5cf6', icon: '🔀' },
  { id: 'cognito', label: 'Cognito',      sub: 'Auth / JWT',       x: 60,  y: 350, color: '#ec4899', icon: '🔐' },
  { id: 'lambda',  label: 'Lambda',       sub: 'CRUD Handlers',    x: 430, y: 260, color: '#10b981', icon: 'λ' },
  { id: 'dynamo',  label: 'DynamoDB',     sub: 'NoSQL + GSI',      x: 620, y: 260, color: '#10b981', icon: '🗃' },
  { id: 'cw',      label: 'CloudWatch',   sub: 'Logs + Alarms',    x: 430, y: 400, color: '#64748b', icon: '📊' },
];

const edges = [
  ['user', 'cf', 'HTTPS'], ['cf', 's3', 'static files'], ['user', 'agw', 'API calls'],
  ['cognito', 'agw', 'JWT validation'], ['agw', 'lambda', 'invoke'], ['lambda', 'dynamo', 'read/write'],
  ['lambda', 'cw', 'logs'],
];

const W = 720, H = 500;

function getPos(id: string) {
  const n = nodes.find(n => n.id === id)!;
  return { x: n.x + 55, y: n.y + 28 };
}

export default function ArchitecturePage() {
  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <h1 style={{ color: '#f1f5f9', fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Architecture Diagram</h1>
      <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>Serverless infrastructure on AWS — no servers to manage, scales to zero</p>

      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', overflowX: 'auto' }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#334155" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map(([from, to, label]) => {
            const a = getPos(from), b = getPos(to);
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            return (
              <g key={`${from}-${to}`}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#334155" strokeWidth="1.5" markerEnd="url(#arrow)" strokeDasharray="4 2" />
                <text x={mx} y={my - 5} textAnchor="middle" fill="#475569" fontSize="10">{label}</text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(n => (
            <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
              <rect width={110} height={56} rx={8} fill={`${n.color}18`} stroke={`${n.color}60`} strokeWidth="1.5" />
              <text x={16} y={22} fill={n.color} fontSize="16">{n.icon}</text>
              <text x={36} y={22} fill="#e2e8f0" fontSize="12" fontWeight="600">{n.label}</text>
              <text x={36} y={38} fill="#64748b" fontSize="10">{n.sub}</text>
            </g>
          ))}
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '20px' }}>
        {[
          { title: 'No Servers', desc: 'Lambda scales automatically from 0 to thousands of concurrent executions', icon: '⚡' },
          { title: 'Pay Per Request', desc: 'First 1M Lambda requests/month are free. DynamoDB charges per read/write unit.', icon: '💰' },
          { title: 'Global CDN', desc: 'CloudFront serves static assets from 450+ edge locations worldwide', icon: '🌍' },
          { title: 'Built-in Auth', desc: 'Cognito handles user pools, JWT tokens, and OAuth flows out of the box', icon: '🔐' },
        ].map(c => (
          <div key={c.title} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{c.icon}</div>
            <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{c.title}</div>
            <div style={{ color: '#64748b', fontSize: '12px', lineHeight: '1.5' }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
