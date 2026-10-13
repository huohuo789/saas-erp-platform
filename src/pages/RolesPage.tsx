import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { notify } from '../components/FeedbackHost';
import { useAuth } from '../auth/AuthContext';
import type { DataScope, Role } from '../types/api';

const permissionGroups = [
  { title: '工作空间', items: [{ key: 'dashboard:read', label: '查看工作台' }] },
  { title: '用户管理', items: [
    { key: 'users:read', label: '查看用户' }, { key: 'users:create', label: '新增用户' },
    { key: 'users:update', label: '编辑用户' }, { key: 'users:delete', label: '删除用户' }
  ]},
  { title: '租户管理', items: [
    { key: 'tenants:read', label: '查看租户' }, { key: 'tenants:create', label: '新增租户' },
    { key: 'tenants:update', label: '编辑租户' }, { key: 'tenants:delete', label: '删除租户' }
  ]},
  { title: '平台权限', items: [
    { key: 'roles:read', label: '查看角色' }, { key: 'roles:manage', label: '配置角色权限' }, { key: 'settings:read', label: '查看系统设置' },
    { key: 'departments:read', label: '查看部门' }, { key: 'departments:create', label: '新增部门' }, { key: 'departments:update', label: '编辑部门' }, { key: 'departments:delete', label: '删除部门' },
    { key: 'company:read', label: '查看企业资料' }, { key: 'menus:read', label: '查看菜单管理' }, { key: 'audit:read', label: '查看操作日志' }, { key: 'profile:read', label: '查看个人设置' }
  ]}
] as const;

const scopeOptions: { value: DataScope; label: string; detail: string }[] = [
  { value: 'all', label: '全部数据', detail: '可访问当前租户内的全部业务数据' },
  { value: 'department_and_children', label: '本部门及下级部门', detail: '可访问所属部门及其下级部门的数据' },
  { value: 'department', label: '仅本部门', detail: '仅可访问所属部门的数据' },
  { value: 'self', label: '仅本人', detail: '仅可访问由本人创建或负责的数据' },
  { value: 'custom', label: '自定义部门', detail: '仅可访问下方勾选部门的数据' }
];
const departmentOptions = ['管理部', '销售部', '仓储部', '财务部'];
const emptyRole = () => ({ name: '', code: '', description: '', status: '启用' as const, permissions: ['dashboard:read'], dataScope: 'self' as DataScope, departments: [] as string[] });

export default function RolesPage() {
  const { refreshUser, user } = useAuth();
  const canManage = Boolean(user?.permissions?.includes('roles:manage') || user?.permissions?.includes('platform:*') || user?.permissions?.includes('*'));
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState<Role | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const selectedRole = useMemo(() => roles.find(role => role.id === selectedId) || null, [roles, selectedId]);

  async function loadRoles(preferredId?: string) {
    setLoading(true);
    try {
      const list = await api.getRoles();
      setRoles(list);
      const nextId = preferredId || selectedId || list[0]?.id || '';
      setSelectedId(list.some(role => role.id === nextId) ? nextId : (list[0]?.id || ''));
      setDraft(null); setIsNew(false);
    } catch (error) { notify(error instanceof Error ? error.message : '角色列表加载失败', 'error'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadRoles(); }, []);
  useEffect(() => {
    if (!isNew && selectedRole) setDraft({ ...selectedRole, permissions: [...selectedRole.permissions], departments: [...selectedRole.departments] });
  }, [selectedId, roles, isNew]);

  const updateDraft = (patch: Partial<Role>) => setDraft(current => current ? { ...current, ...patch } : current);
  const togglePermission = (key: string, checked: boolean) => setDraft(current => current ? ({ ...current, permissions: checked ? [...new Set([...current.permissions, key])] : current.permissions.filter(item => item !== key) }) : current);
  const toggleDepartment = (department: string, checked: boolean) => setDraft(current => current ? ({ ...current, departments: checked ? [...new Set([...current.departments, department])] : current.departments.filter(item => item !== department) }) : current);
  const createRole = () => { setSelectedId(''); setIsNew(true); setDraft({ ...emptyRole(), id: '', updatedAt: '' }); };
  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.code.trim()) { notify('请填写角色名称和角色编码。', 'error'); return; }
    if (draft.dataScope === 'custom' && draft.departments.length === 0) { notify('自定义部门数据范围至少选择一个部门。', 'error'); return; }
    setSaving(true);
    try {
      const saved = await api.saveRole({ ...draft, name: draft.name.trim(), code: draft.code.trim() });
      notify(isNew ? '角色创建成功' : '角色配置已保存', 'success');
      await refreshUser();
      await loadRoles(saved.id);
    } catch (error) { notify(error instanceof Error ? error.message : '角色保存失败', 'error'); }
    finally { setSaving(false); }
  };
  const remove = async (role: Role) => {
    if (!window.confirm(`确定删除角色“${role.name}”吗？该操作不可撤销。`)) return;
    try { await api.deleteRole(role.id); notify('角色已删除', 'success'); await loadRoles(roles.find(item => item.id !== role.id)?.id); }
    catch (error) { notify(error instanceof Error ? error.message : '删除失败', 'error'); }
  };

  return <div className="roles-page">
    <div className="roles-heading"><div><h1 className="page-title">角色与权限</h1><p className="page-desc">统一配置角色信息、菜单/操作权限与业务数据可见范围。</p></div><button className="primary-button" onClick={createRole} disabled={!canManage}>＋ 新建角色</button></div>
    <div className="roles-layout">
      <section className="panel role-list-panel"><div className="panel-heading"><h3>角色列表</h3><span className="muted">{roles.length} 个角色</span></div>
        {loading ? <p className="muted">正在加载角色…</p> : roles.map(role => <div key={role.id} className={`role-list-item ${selectedId === role.id && !isNew ? 'selected' : ''}`}>
          <button className="role-select" onClick={() => { setIsNew(false); setSelectedId(role.id); }}><span className="role-avatar">{role.name.slice(0, 1)}</span><span className="role-name-wrap"><strong>{role.name}</strong><small>{role.code}</small></span><span className={`role-status ${role.status === '启用' ? 'on' : 'off'}`}>{role.status}</span></button>
          <button className="role-delete" title="删除角色" onClick={() => void remove(role)} disabled={role.id === 'R0001' || !canManage}>删除</button>
        </div>)}
        <p className="role-list-tip">提示：系统管理员角色为内置角色，不可删除。</p>
      </section>
      <section className="panel role-editor">{!draft ? <div className="empty-state">选择一个角色查看配置，或新建角色。</div> : <>
        <div className="panel-heading"><div><h3>{isNew ? '新建角色' : '角色配置'}</h3><p className="muted">{canManage ? '保存后立即更新当前 Mock 会话中的角色配置。' : '当前账号只有查看权限，不能修改角色配置。'}</p></div><span className="role-id">{isNew ? '新角色' : draft.id}</span></div>
        <div className="role-form-grid">
          <label className="field-label">角色名称 <input value={draft.name} disabled={!canManage} maxLength={40} onChange={e => updateDraft({ name: e.target.value })} placeholder="例如：销售主管" /></label>
          <label className="field-label">角色编码 <input value={draft.code} disabled={!canManage} maxLength={40} onChange={e => updateDraft({ code: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') })} placeholder="例如：sales_lead" /></label>
          <label className="field-label">状态 <select value={draft.status} disabled={!canManage} onChange={e => updateDraft({ status: e.target.value as Role['status'] })}><option>启用</option><option>停用</option></select></label>
          <label className="field-label">角色说明 <input value={draft.description} disabled={!canManage} maxLength={120} onChange={e => updateDraft({ description: e.target.value })} placeholder="描述该角色的职责" /></label>
        </div>
        <div className="config-section"><div className="config-section-title"><div><h4>菜单与操作权限</h4><p>按模块配置查看、新增、编辑、删除等权限。</p></div><span className="permission-count">{draft.permissions.length} 项已选</span></div>
          <div className="permission-groups">{permissionGroups.map(group => <div className="permission-group" key={group.title}><h5>{group.title}</h5><div className="permission-options">{group.items.map(item => <label key={item.key} className="permission-option"><input type="checkbox" checked={draft.permissions.includes(item.key)} disabled={!canManage} onChange={e => togglePermission(item.key, e.target.checked)} /><span>{item.label}</span><code>{item.key}</code></label>)}</div></div>)}</div>
        </div>
        <div className="config-section"><div className="config-section-title"><div><h4>业务数据权限</h4><p>定义该角色在租户范围内可查看哪些业务数据。</p></div></div>
          <div className="scope-options">{scopeOptions.map(option => <label className={`scope-option ${draft.dataScope === option.value ? 'active' : ''}`} key={option.value}><input type="radio" name="dataScope" value={option.value} checked={draft.dataScope === option.value} disabled={!canManage} onChange={() => updateDraft({ dataScope: option.value })} /><span><strong>{option.label}</strong><small>{option.detail}</small></span></label>)}</div>
          {draft.dataScope === 'custom' && <div className="department-picker"><strong>可访问部门</strong><div>{departmentOptions.map(dept => <label key={dept}><input type="checkbox" checked={draft.departments.includes(dept)} disabled={!canManage} onChange={e => toggleDepartment(dept, e.target.checked)} />{dept}</label>)}</div></div>}
          <p className="security-note">安全说明：此处是前端配置界面与 Mock 演示。接入真实后端后，必须由服务端在每次 API 请求中强制执行权限和数据范围。</p>
        </div>
        <div className="role-editor-actions"><button className="secondary-button" onClick={() => { setIsNew(false); setDraft(selectedRole ? { ...selectedRole, permissions: [...selectedRole.permissions], departments: [...selectedRole.departments] } : null); }}>重置</button><button className="primary-button" disabled={saving || !canManage} onClick={() => void save()}>{saving ? '保存中…' : '保存配置'}</button></div>
      </>}</section>
    </div>
  </div>;
}
