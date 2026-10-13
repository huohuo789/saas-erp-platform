import type { Role, Tenant, User } from '../types/api';
export const mockUsers: User[] = [
 {id:'U1001',name:'张伟',account:'zhangwei',department:'管理部',role:'系统管理员',status:'启用',lastLogin:'2026-10-13 09:12'},
 {id:'U1002',name:'李娜',account:'lina',department:'销售部',role:'销售经理',status:'启用',lastLogin:'2026-10-13 08:45'},
 {id:'U1003',name:'王强',account:'wangqiang',department:'仓储部',role:'仓库主管',status:'启用',lastLogin:'2026-10-12 17:26'},
 {id:'U1004',name:'赵敏',account:'zhaomin',department:'财务部',role:'财务人员',status:'停用',lastLogin:'2026-10-08 14:01'}
];
export const mockTenants: Tenant[] = [
 {id:'T0001',name:'示例贸易有限公司',plan:'专业版',status:'正常',expireAt:'2027-10-12',userCount:18},
 {id:'T0002',name:'华东供应链公司',plan:'基础版',status:'试用',expireAt:'2026-11-12',userCount:6},
 {id:'T0003',name:'北方商贸有限公司',plan:'专业版',status:'正常',expireAt:'2027-06-30',userCount:32}
];


export const mockRoles: Role[] = [
 { id:'R0001', name:'系统管理员', code:'admin', description:'负责平台配置与系统维护', status:'启用', permissions:['dashboard:read','users:read','users:create','users:update','users:delete','tenants:read','tenants:create','tenants:update','tenants:delete','roles:read','roles:manage','settings:read','departments:read','departments:create','departments:update','departments:delete','company:read','menus:read','audit:read','profile:read'], dataScope:'all', departments:[], updatedAt:'2026-10-13 09:00' },
 { id:'R0002', name:'销售经理', code:'sales_manager', description:'管理销售团队及客户业务', status:'启用', permissions:['dashboard:read','users:read'], dataScope:'department_and_children', departments:['销售部'], updatedAt:'2026-10-12 16:30' },
 { id:'R0003', name:'仓库主管', code:'warehouse_manager', description:'负责仓储团队与库存业务', status:'启用', permissions:['dashboard:read'], dataScope:'department', departments:['仓储部'], updatedAt:'2026-10-11 14:20' }
];

// Additional role used by the demo finance user.
mockRoles.push({
 id:'R0004', name:'财务人员', code:'finance_staff', description:'查看财务相关基础信息',
 status:'启用', permissions:['dashboard:read'], dataScope:'self', departments:['财务部'], updatedAt:'2026-10-10 10:00'
});
