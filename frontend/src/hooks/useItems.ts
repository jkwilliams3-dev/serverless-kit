import { useState, useCallback, useEffect } from 'react';
import type {
  Item,
  CreateItemPayload,
  UpdateItemPayload,
  ListParams,
  Pagination,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ---------------------------------------------------------------------------
// Mock data — used when API_URL is not a real endpoint
// ---------------------------------------------------------------------------
const MOCK_ITEMS: Item[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    type: 'item',
    name: 'User Authentication Service',
    description: 'Handles sign-up, sign-in, and token refresh via Cognito.',
    status: 'active',
    tags: ['cognito', 'auth', 'lambda'],
    metadata: {},
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2024-01-15T10:30:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    type: 'item',
    name: 'Data Export Pipeline',
    description: 'Exports DynamoDB snapshots to S3 on a nightly schedule.',
    status: 'active',
    tags: ['s3', 'dynamo', 'scheduled'],
    metadata: {},
    createdAt: '2024-01-16T09:00:00.000Z',
    updatedAt: '2024-01-16T09:00:00.000Z',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    type: 'item',
    name: 'Email Notification Worker',
    description: 'Processes SQS queue and sends transactional emails via SES.',
    status: 'active',
    tags: ['sqs', 'ses', 'worker'],
    metadata: {},
    createdAt: '2024-01-17T11:00:00.000Z',
    updatedAt: '2024-01-17T11:00:00.000Z',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    type: 'item',
    name: 'Image Processing Lambda',
    description: 'Resizes and optimises uploaded images stored in S3.',
    status: 'inactive',
    tags: ['s3', 'sharp', 'images'],
    metadata: {},
    createdAt: '2024-01-18T12:00:00.000Z',
    updatedAt: '2024-01-18T12:00:00.000Z',
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    type: 'item',
    name: 'API Rate Limiter',
    description: 'Token-bucket rate limiting middleware for all API routes.',
    status: 'active',
    tags: ['api-gateway', 'waf', 'security'],
    metadata: {},
    createdAt: '2024-01-19T14:00:00.000Z',
    updatedAt: '2024-01-19T14:00:00.000Z',
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    type: 'item',
    name: 'Legacy CSV Importer',
    description: 'One-off batch import for migrating legacy CSV data.',
    status: 'archived',
    tags: ['migration', 'batch', 'csv'],
    metadata: {},
    createdAt: '2024-01-10T08:00:00.000Z',
    updatedAt: '2024-01-20T08:00:00.000Z',
  },
  {
    id: '77777777-7777-4777-8777-777777777777',
    type: 'item',
    name: 'Search Index Builder',
    description: 'Streams DynamoDB changes to OpenSearch for full-text search.',
    status: 'active',
    tags: ['opensearch', 'streams', 'search'],
    metadata: {},
    createdAt: '2024-01-21T16:00:00.000Z',
    updatedAt: '2024-01-21T16:00:00.000Z',
  },
  {
    id: '88888888-8888-4888-8888-888888888888',
    type: 'item',
    name: 'Audit Log Aggregator',
    description: 'Collects CloudTrail events and stores them in a queryable format.',
    status: 'active',
    tags: ['cloudtrail', 'audit', 'compliance'],
    metadata: {},
    createdAt: '2024-01-22T17:00:00.000Z',
    updatedAt: '2024-01-22T17:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Mock API helpers
// ---------------------------------------------------------------------------
let mockItems = [...MOCK_ITEMS];

const mockDelay = () => new Promise((r) => setTimeout(r, 200 + Math.random() * 300));

const useMock = () => API_URL.includes('localhost:3000') || API_URL.includes('execute-api') === false;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err?.error?.message || 'Request failed');
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async (params: ListParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      if (useMock()) {
        await mockDelay();
        let filtered = [...mockItems];
        if (params.status) filtered = filtered.filter((i) => i.status === params.status);
        if (params.search) {
          const q = params.search.toLowerCase();
          filtered = filtered.filter(
            (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
          );
        }
        const sortBy = params.sortBy ?? 'createdAt';
        const order = params.sortOrder ?? 'desc';
        filtered.sort((a, b) => {
          const av = a[sortBy] ?? '';
          const bv = b[sortBy] ?? '';
          return order === 'asc' ? (av < bv ? -1 : 1) : av > bv ? -1 : 1;
        });
        setItems(filtered);
        setPagination({ limit: params.limit ?? 20, count: filtered.length, nextKey: null, hasMore: false });
      } else {
        const qs = new URLSearchParams();
        if (params.limit) qs.set('limit', String(params.limit));
        if (params.nextKey) qs.set('nextKey', params.nextKey);
        if (params.status) qs.set('status', params.status);
        if (params.search) qs.set('search', params.search);
        if (params.sortBy) qs.set('sortBy', params.sortBy);
        if (params.sortOrder) qs.set('sortOrder', params.sortOrder);
        const data = await apiFetch<{ data: Item[]; pagination: Pagination }>(`/items?${qs}`);
        setItems(data.data);
        setPagination(data.pagination ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(async (payload: CreateItemPayload): Promise<Item> => {
    if (useMock()) {
      await mockDelay();
      const newItem: Item = {
        id: crypto.randomUUID(),
        type: 'item',
        name: payload.name,
        description: payload.description ?? '',
        status: payload.status ?? 'active',
        tags: payload.tags ?? [],
        metadata: payload.metadata ?? {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockItems = [newItem, ...mockItems];
      return newItem;
    }
    const data = await apiFetch<{ data: Item }>('/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.data;
  }, []);

  const updateItem = useCallback(async (id: string, payload: UpdateItemPayload): Promise<Item> => {
    if (useMock()) {
      await mockDelay();
      const idx = mockItems.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error('Item not found');
      mockItems[idx] = { ...mockItems[idx], ...payload, updatedAt: new Date().toISOString() };
      return mockItems[idx];
    }
    const data = await apiFetch<{ data: Item }>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data.data;
  }, []);

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    if (useMock()) {
      await mockDelay();
      mockItems = mockItems.filter((i) => i.id !== id);
      return;
    }
    await fetch(`${API_URL}/items/${id}`, { method: 'DELETE' });
  }, []);

  // Load items on mount
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, pagination, loading, error, fetchItems, createItem, updateItem, deleteItem };
}
