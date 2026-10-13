import { createCrudSchema } from './crudFactory';

export const tenantsSchema = createCrudSchema({
  title: '租户管理',
  subtitle: '管理 SaaS 企业租户、套餐及服务期限。支持筛选、分页、新增、编辑、删除。',
  endpoint: '/api/v1/platform/tenants',
  permissions: { read: 'tenants:read', create: 'tenants:create', update: 'tenants:update', delete: 'tenants:delete' },
  columns: [
    { name: 'id', label: '租户编号' }, { name: 'name', label: '企业名称' },
    { name: 'plan', label: '当前套餐' }, { name: 'status', label: '租户状态' },
    { name: 'userCount', label: '成员数量' }, { name: 'expireAt', label: '服务到期日' }
  ],
  filters: [
    { name: 'keyword', label: '企业名称', placeholder: '输入企业名称' },
    { name: 'status', label: '租户状态', type: 'select', options: [{ label: '正常', value: '正常' }, { label: '试用', value: '试用' }, { label: '已停用', value: '已停用' }] }
  ],
  fields: [
    { name: 'name', label: '企业名称', required: true },
    { name: 'plan', label: '套餐', type: 'select', required: true, options: [{ label: '基础版', value: '基础版' }, { label: '专业版', value: '专业版' }, { label: '企业版', value: '企业版' }] },
    { name: 'status', label: '状态', type: 'select', required: true, options: [{ label: '正常', value: '正常' }, { label: '试用', value: '试用' }, { label: '已停用', value: '已停用' }] },
    { name: 'expireAt', label: '服务到期日', type: 'input-date', required: true },
    { name: 'userCount', label: '成员数量', type: 'input-number', required: true }
  ]
});
