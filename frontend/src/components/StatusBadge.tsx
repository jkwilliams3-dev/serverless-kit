import type { ItemStatus } from '../types';

const styles: Record<ItemStatus, { bg: string; color: string; label: string }> = {
  active:   { bg: '#052e16', color: '#4ade80', label: 'Active' },
  inactive: { bg: '#1c1917', color: '#a8a29e', label: 'Inactive' },
  archived: { bg: '#1c1917', color: '#6b7280', label: 'Archived' },
};

export default function StatusBadge({ status }: { status: ItemStatus }) {
  const s = styles[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        background: s.bg,
        color: s.color,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: s.color,
        }}
      />
      {s.label}
    </span>
  );
}
