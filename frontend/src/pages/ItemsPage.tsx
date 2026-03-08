import { useState, useCallback } from 'react';
import {
  Plus, Search, ChevronUp, ChevronDown, Trash2, Pencil,
  RefreshCw, AlertCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useItems } from '../hooks/useItems';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ItemForm from '../components/ItemForm';
import type { Item, ItemStatus, SortField, SortOrder, CreateItemPayload } from '../types';

const PAGE_SIZE = 10;

export default function ItemsPage() {
  const { items, pagination, loading, error, fetchItems, createItem, updateItem, deleteItem } =
    useItems();

  // Filters / sort state (client-side for mock, passed to API for real)
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | ''>('');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(0);

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    fetchItems({
      search: search || undefined,
      status: (statusFilter as ItemStatus) || undefined,
      sortBy,
      sortOrder,
      limit: PAGE_SIZE,
    });
    setPage(0);
  }, [fetchItems, search, statusFilter, sortBy, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleCreate = async (payload: CreateItemPayload) => {
    setActionError(null);
    try {
      await createItem(payload);
      setCreateOpen(false);
      refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to create item');
    }
  };

  const handleUpdate = async (payload: CreateItemPayload) => {
    if (!editItem) return;
    setActionError(null);
    try {
      await updateItem(editItem.id, payload);
      setEditItem(null);
      refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to update item');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionError(null);
    try {
      await deleteItem(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to delete item');
    }
  };

  // Apply client-side filtering for mock mode
  let displayed = [...items];
  if (search) {
    const q = search.toLowerCase();
    displayed = displayed.filter(
      (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
    );
  }
  if (statusFilter) displayed = displayed.filter((i) => i.status === statusFilter);
  displayed.sort((a, b) => {
    const av = a[sortBy] ?? '';
    const bv = b[sortBy] ?? '';
    return sortOrder === 'asc' ? (av < bv ? -1 : 1) : av > bv ? -1 : 1;
  });

  const totalPages = Math.ceil(displayed.length / PAGE_SIZE);
  const pageItems = displayed.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ChevronUp size={14} style={{ opacity: 0.3 }} />;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const thStyle: React.CSSProperties = {
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '14px 16px',
    borderTop: '1px solid #1e293b',
    fontSize: '14px',
    color: '#cbd5e1',
    verticalAlign: 'middle',
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#f1f5f9' }}>Items</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
            Manage your serverless application items via the REST API
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ff9900',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            color: '#0f172a',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          New Item
        </button>
      </div>

      {/* Error banner */}
      {(error || actionError) && (
        <div
          style={{
            background: '#450a0a',
            border: '1px solid #7f1d1d',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            color: '#fca5a5',
            fontSize: '14px',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          {error || actionError}
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            aria-label="Search items"
            style={{
              width: '100%',
              background: '#020617',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '9px 12px 9px 36px',
              color: '#f1f5f9',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ItemStatus | '')}
          aria-label="Filter by status"
          style={{
            background: '#020617',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '9px 12px',
            color: '#f1f5f9',
            fontSize: '14px',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>

        {/* Refresh */}
        <button
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh items"
          style={{
            background: '#1e293b',
            border: 'none',
            borderRadius: '8px',
            padding: '9px 14px',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
          }}
        >
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>

        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b' }}>
          {displayed.length} item{displayed.length !== 1 ? 's' : ''}
          {pagination && <span style={{ color: '#475569' }}> · page {page + 1}/{Math.max(totalPages, 1)}</span>}
        </span>
      </div>

      {/* Table */}
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a1628' }}>
                <th
                  style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('name')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Name <SortIcon field="name" />
                  </span>
                </th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Tags</th>
                <th
                  style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('createdAt')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Created <SortIcon field="createdAt" />
                  </span>
                </th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && pageItems.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#475569', padding: '40px' }}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && pageItems.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#475569', padding: '40px' }}>
                    No items found.{' '}
                    <button
                      onClick={() => setCreateOpen(true)}
                      style={{ background: 'none', border: 'none', color: '#ff9900', cursor: 'pointer', fontSize: '14px' }}
                    >
                      Create one →
                    </button>
                  </td>
                </tr>
              )}
              {pageItems.map((item) => (
                <tr
                  key={item.id}
                  style={{ transition: 'background 0.1s' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#0d1f35')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
                >
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: '2px' }}>{item.name}</div>
                    {item.description && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#64748b',
                          maxWidth: '380px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <StatusBadge status={item.status} />
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            background: '#1e3a5f',
                            color: '#93c5fd',
                            borderRadius: '4px',
                            padding: '2px 7px',
                            fontSize: '11px',
                            fontWeight: 500,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span style={{ fontSize: '11px', color: '#475569' }}>+{item.tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setEditItem(item)}
                        aria-label={`Edit ${item.name}`}
                        style={{
                          background: '#1e293b',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '13px',
                        }}
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        aria-label={`Delete ${item.name}`}
                        style={{
                          background: '#1c1010',
                          border: '1px solid #450a0a',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: '#f87171',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '13px',
                        }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderTop: '1px solid #1e293b',
            }}
          >
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, displayed.length)} of{' '}
              {displayed.length}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                aria-label="Previous page"
                style={{
                  background: page === 0 ? '#0a1628' : '#1e293b',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: page === 0 ? '#334155' : '#94a3b8',
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  aria-label={`Page ${i + 1}`}
                  aria-current={page === i ? 'page' : undefined}
                  style={{
                    background: page === i ? '#ff9900' : '#1e293b',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: page === i ? '#0f172a' : '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: page === i ? 700 : 400,
                    fontSize: '14px',
                    minWidth: '36px',
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                aria-label="Next page"
                style={{
                  background: page >= totalPages - 1 ? '#0a1628' : '#1e293b',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: page >= totalPages - 1 ? '#334155' : '#94a3b8',
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} title="Create New Item" onClose={() => setCreateOpen(false)}>
        <ItemForm
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          submitLabel="Create Item"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editItem !== null}
        title={`Edit: ${editItem?.name ?? ''}`}
        onClose={() => setEditItem(null)}
      >
        {editItem && (
          <ItemForm
            initial={editItem}
            onSubmit={handleUpdate}
            onCancel={() => setEditItem(null)}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={deleteTarget !== null} title="Confirm Delete" onClose={() => setDeleteTarget(null)} maxWidth="400px">
        {deleteTarget && (
          <div>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: 0 }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: '#f1f5f9' }}>{deleteTarget.name}</strong>? This action cannot be
              undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setDeleteTarget(null)}
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
                onClick={handleDelete}
                style={{
                  background: '#dc2626',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
