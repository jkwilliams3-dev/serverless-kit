import { useState } from 'react';
import type { CreateItemPayload, Item, ItemStatus } from '../types';

interface ItemFormProps {
  initial?: Partial<Item>;
  onSubmit: (payload: CreateItemPayload) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#020617',
  border: '1px solid #1e293b',
  borderRadius: '8px',
  padding: '10px 12px',
  color: '#f1f5f9',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#94a3b8',
  marginBottom: '6px',
};

const fieldStyle: React.CSSProperties = {
  marginBottom: '16px',
};

export default function ItemForm({ initial, onSubmit, onCancel, submitLabel = 'Create Item' }: ItemFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<ItemStatus>(initial?.status ?? 'active');
  const [tagsRaw, setTagsRaw] = useState((initial?.tags ?? []).join(', '));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    else if (name.length > 200) e.name = 'Max 200 characters';
    if (description.length > 2000) e.description = 'Max 2000 characters';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const tags = tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await onSubmit({ name: name.trim(), description: description.trim(), status, tags });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={fieldStyle}>
        <label htmlFor="item-name" style={labelStyle}>Name *</label>
        <input
          id="item-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
          placeholder="e.g. Email Notification Worker"
          style={{ ...inputStyle, borderColor: errors.name ? '#ef4444' : '#1e293b' }}
          autoFocus
        />
        {errors.name && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.name}</p>}
      </div>

      <div style={fieldStyle}>
        <label htmlFor="item-desc" style={labelStyle}>Description</label>
        <textarea
          id="item-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this service/component do?"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', borderColor: errors.description ? '#ef4444' : '#1e293b' }}
        />
        {errors.description && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.description}</p>}
      </div>

      <div style={fieldStyle}>
        <label htmlFor="item-status" style={labelStyle}>Status</label>
        <select
          id="item-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ItemStatus)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label htmlFor="item-tags" style={labelStyle}>Tags (comma-separated)</label>
        <input
          id="item-tags"
          type="text"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="lambda, s3, api-gateway"
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'transparent',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '10px 20px',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          style={{
            background: submitting ? '#92400e' : '#ff9900',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            color: '#0f172a',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
