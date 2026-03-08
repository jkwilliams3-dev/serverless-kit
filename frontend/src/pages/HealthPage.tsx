const functions = [
  { name: 'createItem', route: 'POST /items', status: 'healthy', latency: '48ms', invocations: 1842, errors: 0 },
  { name: 'getItem',    route: 'GET /items/:id', status: 'healthy', latency: '22ms', invocations: 5219, errors: 1 },
  { name: 'listItems',  route: 'GET /items', status: 'healthy', latency: '61ms', invocations: 9341, errors: 0 },
  { name: 'updateItem', route: 'PUT /items/:id', status: 'healthy', latency: '39ms', invocations: 776, errors: 2 },
  { name: 'deleteItem', route: 'DELETE /items/:id', status: 'degraded', latency: '312ms', invocations: 203, errors: 5 },
];

const services = [
  { name: 'DynamoDB', region: 'us-east-1', status: 'healthy', reads: '4.2K RCU', writes: '1.1K WCU' },
  { name: 'API Gateway', region: 'us-east-1', status: 'healthy', requests: '17.4K / day', latency: '38ms' },
  { name: 'CloudFront', region: 'Global', status: 'healthy', cache: '94.2%', bandwidth: '2.3 GB' },
  { name: 'Cognito', region: 'us-east-1', status: 'healthy', users: '3,847', active: '124' },
];

export default function HealthPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <h1 style={{ color: '#f1f5f9', fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>API Health</h1>
      <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>Live status of Lambda functions and AWS services</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'All Functions', value: '5', color: '#f1f5f9' },
          { label: 'Healthy', value: '4', color: '#34d399' },
          { label: 'Degraded', value: '1', color: '#fbbf24' },
        ].map(s => (
          <div key={s.label} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '26px', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <h2 style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Lambda Functions</h2>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', overflow: 'hidden', marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', background: 'rgba(15,23,42,0.5)' }}>
              {['Function', 'Route', 'Status', 'Avg Latency', 'Invocations', 'Errors'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', color: '#64748b', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {functions.map(fn => (
              <tr key={fn.name} style={{ borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
                <td style={{ padding: '12px 16px', color: '#e2e8f0', fontFamily: 'monospace' }}>{fn.name}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace' }}>{fn.route}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                    background: fn.status === 'healthy' ? 'rgba(6,78,59,0.5)' : 'rgba(120,53,15,0.5)',
                    color: fn.status === 'healthy' ? '#34d399' : '#fbbf24',
                    border: `1px solid ${fn.status === 'healthy' ? 'rgba(4,120,87,0.5)' : 'rgba(180,83,9,0.5)'}`,
                  }}>{fn.status}</span>
                </td>
                <td style={{ padding: '12px 16px', color: fn.status === 'degraded' ? '#fbbf24' : '#34d399' }}>{fn.latency}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{fn.invocations.toLocaleString()}</td>
                <td style={{ padding: '12px 16px', color: fn.errors > 0 ? '#f87171' : '#64748b' }}>{fn.errors}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>AWS Services</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {services.map(s => (
          <div key={s.name} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{s.name}</span>
              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: 'rgba(6,78,59,0.5)', color: '#34d399', border: '1px solid rgba(4,120,87,0.5)' }}>● {s.status}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Object.entries(s).filter(([k]) => !['name', 'status'].includes(k)).map(([k, v]) => (
                <div key={k}>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>{k}</div>
                  <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '2px' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
