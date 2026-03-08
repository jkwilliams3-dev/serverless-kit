import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Activity, Network, Server } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Items', icon: LayoutDashboard },
  { to: '/health', label: 'API Health', icon: Activity },
  { to: '/architecture', label: 'Architecture', icon: Network },
];

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#030712' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '220px',
          background: '#0f172a',
          borderRight: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '20px 16px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              background: '#ff9900',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Server size={18} color="#0f172a" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#f1f5f9', lineHeight: 1 }}>
              ServerlessKit
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>AWS Dashboard</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '4px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'background 0.15s',
                background: isActive ? '#1e293b' : 'transparent',
                color: isActive ? '#ff9900' : '#94a3b8',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #1e293b',
            fontSize: '11px',
            color: '#475569',
          }}
        >
          <div style={{ color: '#64748b', marginBottom: '4px' }}>Built by</div>
          <div style={{ color: '#94a3b8', fontWeight: 600 }}>Jonathan Williams</div>
          <div style={{ marginTop: '4px', color: '#ff9900', fontSize: '10px' }}>
            Senior Cloud Architect
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
