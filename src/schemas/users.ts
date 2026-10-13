import { createCrudSchema } from './crudFactory';

export const usersSchema = createCrudSchema({
  title: '用户管理',
  subtitle: '管理企业成员、所属部门及角色权限。支持筛选、分页、新增、编辑、删除。',
  endpoint: '/api/v1/users',
  permissions: { read: 'users:read', create: 'users:create', update: 'users:update', delete: 'users:delete' },
  columns: [
    { name: 'id', label: '用户编号' }, { name: 'name', label: '姓名' },
    { name: 'account', label: '登录账号' }, { name: 'department', label: '所属部门' },
    { name: 'role', label: '角色' },
    { name: 'status', label: '状态', type: 'mapping', map: { '启用': '<span class="label label-success">启用</span>', '停用': '<span class="label label-default">停用</span>' } },
    { name: 'lastLogin', label: '最近登录' }
  ],
  filters: [
    { name: 'keyword', label: '姓名/账号', placeholder: '输入姓名或账号' },
    { name: 'status', label: '状态', type: 'select', options: [{ label: '启用', value: '启用' }, { label: '停用', value: '停用' }] }
  ],
  fields: [
    { name: 'name', label: '姓名', required: true }, { name: 'account', label: '登录账号', required: true },
    { name: 'department', label: '所属部门', required: true }, { name: 'role', label: '角色', type: 'select', required: true, source: '/api/v1/platform/roles/options', description: '选项来自已启用的角色。' },
    { name: 'status', label: '状态', type: 'select', required: true, options: [{ label: '启用', value: '启用' }, { label: '停用', value: '停用' }] }
  ]
});
