export interface ApiResponse<T> { code: number; message: string; data: T }
export interface PageResult<T> { items: T[]; total: number; page: number; pageSize: number }
export interface User {
  id: string;
  name: string;
  account: string;
  department: string;
  role: string;
  status: '启用' | '停用';
  lastLogin: string;
}
export interface Tenant { id: string; name: string; plan: string; status: '正常' | '试用' | '已停用'; expireAt: string; userCount: number }
export type DataScope = 'all' | 'department' | 'department_and_children' | 'self' | 'custom';
export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  status: '启用' | '停用';
  permissions: string[];
  dataScope: DataScope;
  departments: string[];
  updatedAt: string;
}
