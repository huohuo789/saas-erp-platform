export type PermissionKey = string;
export interface MenuItem { key: string; label: string; path: string; icon: string; group: string; permission?: PermissionKey; }
/** One registry is the single source of truth for sidebar links, quick entries and page titles. */
export const menuRegistry: MenuItem[] = [
  { key: 'dashboard', label: '工作台', path: '/', icon: '▦', group: '工作空间', permission: 'dashboard:read' },
  { key: 'users', label: '用户管理', path: '/users', icon: '♙', group: '组织与人员', permission: 'users:read' },
  { key: 'departments', label: '部门管理', path: '/departments', icon: '▤', group: '组织与人员', permission: 'departments:read' },
  { key: 'tenants', label: '租户管理', path: '/tenants', icon: '▣', group: '组织与人员', permission: 'tenants:read' },
  { key: 'company', label: '企业资料', path: '/company', icon: '⌂', group: '组织与人员', permission: 'company:read' },
  { key: 'roles', label: '角色与权限', path: '/roles', icon: '♧', group: '权限管理', permission: 'roles:read' },
  { key: 'menus', label: '菜单管理', path: '/menus', icon: '☷', group: '权限管理', permission: 'menus:read' },
  { key: 'audit', label: '操作日志', path: '/audit-logs', icon: '≡', group: '系统运维', permission: 'audit:read' },
  { key: 'params', label: '系统参数', path: '/system-params', icon: '⚙', group: '系统运维', permission: 'settings:read' },
  { key: 'dictionaries', label: '字典管理', path: '/dictionaries', icon: '☷', group: '系统运维', permission: 'settings:read' },
  { key: 'settings', label: '系统设置', path: '/settings', icon: '⚙', group: '系统运维', permission: 'settings:read' },
  { key: 'profile', label: '个人设置', path: '/profile', icon: '◎', group: '个人中心', permission: 'profile:read' },
];
export function hasPermission(userPermissions: string[] | undefined, required?: string): boolean {
  if (!required) return true;
  const permissions = userPermissions || [];
  return permissions.includes('*') || permissions.includes('platform:*') || permissions.includes(required);
}
export function filterMenu(items: MenuItem[], permissions: string[] | undefined) {
  return items.filter(item => !item.permission || hasPermission(permissions, item.permission));
}
