import { mockRoles, mockTenants, mockUsers } from '../mock/data';
import { tokenStorage } from '../auth/token';
import type { PageResult, Role, Tenant, User } from '../types/api';
import type { CurrentUser, LoginPayload, LoginResult } from '../types/auth';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true';

export class ApiError extends Error {
  status: number;
  code?: string | number;
  constructor(message: string, status: number, code?: string | number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function emitUnauthorized() {
  window.dispatchEvent(new CustomEvent('saas-erp:unauthorized'));
}

/** Unified request layer: auth header, JSON serialization, envelope parsing and error normalization. */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  const token = tokenStorage.getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('网络连接失败，请检查网络或后端服务。', 0);
  }

  if (response.status === 401) {
    tokenStorage.clear();
    emitUnauthorized();
    throw new ApiError('登录状态已失效，请重新登录。', 401);
  }

  const contentType = response.headers.get('content-type') || '';
  const payload: any = contentType.includes('application/json') ? await response.json().catch(() => null) : await response.text();
  if (!response.ok) {
    const message = payload?.message || payload?.detail || payload?.msg || `请求失败（HTTP ${response.status}）`;
    throw new ApiError(message, response.status, payload?.code);
  }
  if (payload && typeof payload === 'object' && 'code' in payload && Number(payload.code) !== 0 && Number(payload.code) !== 200) {
    throw new ApiError(payload.message || payload.msg || '业务请求失败', response.status, payload.code);
  }
  return (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload) as T;
}

const delay = (ms = 180) => new Promise(resolve => setTimeout(resolve, ms));

function filterPage<T extends object>(rows: T[], query: Record<string, any> = {}) {
  const keyword = String(query.keyword || '').trim().toLowerCase();
  const status = String(query.status || '');
  const filtered = rows.filter(row => {
    const keywordMatch = !keyword || Object.values(row as Record<string, any>).some(value => String(value ?? '').toLowerCase().includes(keyword));
    const statusMatch = !status || String((row as Record<string, any>).status || '') === status;
    return keywordMatch && statusMatch;
  });
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = Math.max(1, Number(query.perPage || query.pageSize || 10));
  return { items: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize };
}

function nextId(prefix: string, rows: Array<{ id: string }>) {
  const max = rows.reduce((value, row) => Math.max(value, Number(row.id.replace(/^\D+/, '')) || 0), 1000);
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}
function resolveCurrentUser(account = 'admin'): CurrentUser {
  const user = mockUsers.find(item => item.id === 'U1001') || mockUsers[0];
  const assignedRole = mockRoles.find(role => role.name === user.role && role.status === '启用');
  const roles = assignedRole ? [assignedRole] : [];
  return {
    id: user.id, name: user.name, account, tenantId: 'T0001', tenantName: '示例贸易有限公司',
    roles: roles.map(role => role.code),
    permissions: [...new Set(roles.flatMap(role => role.permissions))]
  };
}

export const api = {
  get useMock() { return USE_MOCK; },

  async login(payload: LoginPayload): Promise<LoginResult> {
    if (!USE_MOCK) return request<LoginResult>('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    await delay(260);
    if (payload.account !== 'admin' || payload.password !== '123456' || (payload.tenantCode && payload.tenantCode !== 'demo')) {
      throw new ApiError('账号、密码或企业标识不正确。演示账号：admin / 123456，企业标识：demo。', 401);
    }
    return { accessToken: `mock-access-${Date.now()}`, refreshToken: `mock-refresh-${Date.now()}`, expiresIn: 7200, user: resolveCurrentUser(payload.account) };
  },

  async logout(): Promise<void> {
    if (!USE_MOCK && tokenStorage.getAccessToken()) await request('/auth/logout', { method: 'POST' });
  },

  async getCurrentUser(): Promise<CurrentUser> {
    if (!USE_MOCK) return request<CurrentUser>('/auth/me');
    await delay(80);
    if (!tokenStorage.getAccessToken()) throw new ApiError('未登录', 401);
    return resolveCurrentUser('admin');
  },

  async getUsers(query: Record<string, any> = {}): Promise<PageResult<User>> {
    if (!USE_MOCK) {
      const params = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)]));
      return request(`/users${params.toString() ? `?${params.toString()}` : ''}`);
    }
    await delay(); return filterPage(mockUsers, query);
  },

  async createUser(input: Partial<User>): Promise<User> {
    if (!USE_MOCK) return request('/users', { method: 'POST', body: JSON.stringify(input) });
    await delay();
    if (mockUsers.some(row => row.account === input.account)) throw new ApiError('该登录账号已存在。', 409);
    if (input.role && !mockRoles.some(role => role.name === input.role && role.status === '启用')) throw new ApiError('请选择一个已启用的角色。', 400);
    const row: User = { id: nextId('U', mockUsers), name: input.name || '', account: input.account || '', department: input.department || '未分配', role: input.role || '普通成员', status: input.status || '启用', lastLogin: '从未登录' };
    mockUsers.unshift(row); return row;
  },

  async updateUser(id: string, input: Partial<User>): Promise<User> {
    if (!USE_MOCK) return request(`/users/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) });
    await delay(); const index = mockUsers.findIndex(row => row.id === id);
    if (index < 0) throw new ApiError('用户不存在。', 404);
    if (input.role && !mockRoles.some(role => role.name === input.role && role.status === '启用')) throw new ApiError('请选择一个已启用的角色。', 400);
    mockUsers[index] = { ...mockUsers[index], ...input, id }; return mockUsers[index];
  },

  async deleteUsers(ids: string[]): Promise<void> {
    if (!USE_MOCK) { await request('/users/bulk', { method: 'DELETE', body: JSON.stringify({ ids }) }); return; }
    await delay(); for (let i = mockUsers.length - 1; i >= 0; i--) if (ids.includes(mockUsers[i].id)) mockUsers.splice(i, 1);
  },

  async getTenants(query: Record<string, any> = {}): Promise<PageResult<Tenant>> {
    if (!USE_MOCK) {
      const params = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)]));
      return request(`/platform/tenants${params.toString() ? `?${params.toString()}` : ''}`);
    }
    await delay(); return filterPage(mockTenants, query);
  },

  async createTenant(input: Partial<Tenant>): Promise<Tenant> {
    if (!USE_MOCK) return request('/platform/tenants', { method: 'POST', body: JSON.stringify(input) });
    await delay(); const row: Tenant = { id: nextId('T', mockTenants), name: input.name || '', plan: input.plan || '基础版', status: input.status || '试用', expireAt: input.expireAt || '', userCount: Number(input.userCount || 0) };
    mockTenants.unshift(row); return row;
  },

  async updateTenant(id: string, input: Partial<Tenant>): Promise<Tenant> {
    if (!USE_MOCK) return request(`/platform/tenants/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) });
    await delay(); const index = mockTenants.findIndex(row => row.id === id);
    if (index < 0) throw new ApiError('租户不存在。', 404);
    mockTenants[index] = { ...mockTenants[index], ...input, id }; return mockTenants[index];
  },

  async deleteTenants(ids: string[]): Promise<void> {
    if (!USE_MOCK) { await request('/platform/tenants/bulk', { method: 'DELETE', body: JSON.stringify({ ids }) }); return; }
    await delay(); for (let i = mockTenants.length - 1; i >= 0; i--) if (ids.includes(mockTenants[i].id)) mockTenants.splice(i, 1);
  },


  async getRoles(): Promise<Role[]> {
    if (!USE_MOCK) return request<Role[]>('/platform/roles');
    await delay(); return mockRoles.map(role => ({ ...role, permissions: [...role.permissions], departments: [...role.departments] }));
  },

  async getRoleOptions(): Promise<Array<{ label: string; value: string }>> {
    if (!USE_MOCK) return request<Array<{ label: string; value: string }>>('/platform/roles/options');
    await delay(80);
    return mockRoles.filter(role => role.status === '启用').map(role => ({ label: role.name, value: role.name }));
  },

  async saveRole(input: Omit<Role, 'updatedAt'> & { updatedAt?: string }): Promise<Role> {
    if (!USE_MOCK) {
      const method = input.id ? 'PUT' : 'POST';
      const path = input.id ? `/platform/roles/${encodeURIComponent(input.id)}` : '/platform/roles';
      return request<Role>(path, { method, body: JSON.stringify(input) });
    }
    await delay();
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    if (input.id) {
      const index = mockRoles.findIndex(role => role.id === input.id);
      if (index < 0) throw new ApiError('角色不存在或已被删除。', 404);
      if (mockRoles.some(role => role.id !== input.id && role.code === input.code)) throw new ApiError('角色编码已存在。', 409);
      mockRoles[index] = { ...mockRoles[index], ...input, updatedAt: now };
      return { ...mockRoles[index] };
    }
    if (mockRoles.some(role => role.code === input.code)) throw new ApiError('角色编码已存在。', 409);
    const next = Math.max(1000, ...mockRoles.map(role => Number(role.id.replace(/^\D+/, '')) || 0)) + 1;
    const created: Role = { ...input, id: `R${String(next).padStart(4, '0')}`, updatedAt: now };
    mockRoles.unshift(created);
    return { ...created };
  },

  async deleteRole(id: string): Promise<void> {
    if (!USE_MOCK) { await request(`/platform/roles/${encodeURIComponent(id)}`, { method: 'DELETE' }); return; }
    await delay();
    const index = mockRoles.findIndex(role => role.id === id);
    if (index < 0) throw new ApiError('角色不存在或已被删除。', 404);
    if (id === 'R0001') throw new ApiError('系统管理员角色不能删除。', 400);
    mockRoles.splice(index, 1);
  },

  async getUser(id: string): Promise<User> {
    if (!USE_MOCK) return request(`/users/${encodeURIComponent(id)}`);
    const row = mockUsers.find(item => item.id === id); if (!row) throw new ApiError('用户不存在。', 404); return { ...row };
  },

  async getTenant(id: string): Promise<Tenant> {
    if (!USE_MOCK) return request(`/platform/tenants/${encodeURIComponent(id)}`);
    const row = mockTenants.find(item => item.id === id); if (!row) throw new ApiError('租户不存在。', 404); return { ...row };
  }
};
