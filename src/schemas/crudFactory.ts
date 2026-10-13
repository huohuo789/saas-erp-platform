/** Generic amis CRUD schema factory. Keep module-specific differences in resource config. */
export type CrudField = {
  name: string; label: string;
  type?: 'input-text' | 'select' | 'input-date' | 'input-number' | 'textarea';
  required?: boolean; options?: Array<{ label: string; value: string }>;
  placeholder?: string; description?: string; source?: string;
};
export type CrudColumn = { name: string; label: string; type?: string; map?: Record<string, string>; width?: number; sortable?: boolean; searchable?: boolean; toggled?: boolean; remark?: string };
export type CrudResource = {
  title: string; subtitle: string; endpoint: string; columns: CrudColumn[]; fields: CrudField[];
  filters?: CrudField[]; primaryKey?: string; createLabel?: string;
  permissions?: { read?: string; create?: string; update?: string; delete?: string };
  defaultPerPage?: number; perPageAvailable?: number[];
};

const toFormItem = (field: CrudField) => ({
  type: field.type || 'input-text', name: field.name, label: field.label,
  required: field.required ?? false,
  ...(field.options ? { options: field.options, clearable: true } : {}),
  ...(field.source ? { source: field.source, clearable: true } : {}),
  ...(field.placeholder ? { placeholder: field.placeholder } : {}),
  ...(field.description ? { description: field.description } : {}),
});

export function createCrudSchema(resource: CrudResource) {
  const endpoint = resource.endpoint;
  const primaryKey = resource.primaryKey || 'id';
  const entityName = resource.title.replace(/管理$/, '');
  const permissions = { read: resource.permissions?.read || '', create: resource.permissions?.create || '', update: resource.permissions?.update || '', delete: resource.permissions?.delete || '' };
  const rowUrl = `${endpoint}/\${${primaryKey}}`;
  const fields = resource.fields.map(toFormItem);
  return {
    type: 'page', title: resource.title, subTitle: resource.subtitle,
    body: [{
      type: 'crud', name: `${endpoint.replace(/\W/g, '-')}-crud`, api: { method: 'get', url: endpoint },
      primaryField: primaryKey, syncLocation: false, perPage: resource.defaultPerPage || 10,
      perPageAvailable: resource.perPageAvailable || [10, 20, 50], keepItemSelectionOnPageChange: true,
      autoFill: false, resizable: true, draggable: false,
      filter: { title: '筛选条件', submitText: '查询', resetText: '重置', body: (resource.filters || []).map(toFormItem) },
      headerToolbar: [
        { type: 'button', label: resource.createLabel || '新增', level: 'primary', visibleOn: permissions.create ? '${canCreate}' : 'false', actionType: 'dialog', dialog: {
          title: `新增${entityName}`, size: 'md', body: { type: 'form', api: { method: 'post', url: endpoint }, messages: { success: '新增成功', failed: '新增失败' }, body: fields,
            actions: [{ type: 'submit', label: '保存', level: 'primary' }, { type: 'button', label: '取消', actionType: 'cancel' }] }
        } },
        'bulkActions', 'reload', 'filter-toggler',
        { type: 'columns-toggler', align: 'right' },
      ],
      bulkActions: [{ label: '批量删除', level: 'danger', visibleOn: permissions.delete ? '${canDelete}' : 'false', actionType: 'ajax', confirmText: '确定删除选中的记录吗？此操作不可撤销。',
        api: { method: 'delete', url: `${endpoint}/bulk`, data: { ids: '${ids}' } }, messages: { success: '批量删除成功', failed: '批量删除失败' } }],
      columns: [
        ...resource.columns.map(column => ({ ...column, ...(column.sortable ? { sortable: true } : {}) })),
        { type: 'operation', label: '操作', width: 150, toggled: true, buttons: [
          { label: '编辑', type: 'button', level: 'link', visibleOn: permissions.update ? '${canUpdate}' : 'false', actionType: 'dialog', dialog: {
            title: `编辑${entityName}`, size: 'md', body: { type: 'form', initApi: { method: 'get', url: rowUrl }, api: { method: 'put', url: rowUrl }, messages: { success: '保存成功', failed: '保存失败' }, body: fields,
              actions: [{ type: 'submit', label: '保存', level: 'primary' }, { type: 'button', label: '取消', actionType: 'cancel' }] }
          } },
          { label: '删除', type: 'button', level: 'link', className: 'text-danger', visibleOn: permissions.delete ? '${canDelete}' : 'false', actionType: 'ajax', confirmText: '确定删除这条记录吗？此操作不可撤销。',
            api: { method: 'delete', url: rowUrl }, messages: { success: '删除成功', failed: '删除失败' } }
        ] }
      ],
      footerToolbar: ['statistics', 'switch-per-page', 'pagination'],
    }]
  };
}
