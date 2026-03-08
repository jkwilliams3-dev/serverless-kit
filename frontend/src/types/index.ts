export type ItemStatus = 'active' | 'inactive' | 'archived';

export interface Item {
  id: string;
  type: string;
  name: string;
  description: string;
  status: ItemStatus;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemPayload {
  name: string;
  description?: string;
  status?: ItemStatus;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateItemPayload {
  name?: string;
  description?: string;
  status?: ItemStatus;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface Pagination {
  limit: number;
  count: number;
  nextKey: string | null;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  pagination?: Pagination;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  timestamp: string;
}

export interface LambdaHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'error';
  latencyP50: number;
  latencyP99: number;
  invocations: number;
  errors: number;
  errorRate: number;
  lastInvoked: string;
}

export type SortField = 'createdAt' | 'updatedAt' | 'name';
export type SortOrder = 'asc' | 'desc';

export interface ListParams {
  limit?: number;
  nextKey?: string;
  status?: ItemStatus;
  search?: string;
  sortBy?: SortField;
  sortOrder?: SortOrder;
}
