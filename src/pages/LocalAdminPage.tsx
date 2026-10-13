import { useEffect, useMemo, useState } from 'react';
import { notify } from '../components/FeedbackHost';

type Row = { id: string; [key: string]: string };
type Field = { key: string; label: string; placeholder?: string };
const configs: Record<string, { title: string; description: string; fields: Field[]; seed: Row[] }> = {
  departments: { title: '部门管理', description: '维护组织部门、上级部门与负责人（本地 Mock 数据）。', fields: [{key:'name',label:'部门名称'},{key:'parent',label:'上级部门'},{key:'leader',label:'部门负责人'},{key:'status',label:'状态'}], seed: [{id:'D001',name:'管理部',parent:'无',leader:'张伟',status:'启用'},{id:'D002',name:'销售部',parent:'无',leader:'李娜',status:'启用'},{id:'D003',name:'仓储部',parent:'无',leader:'王强',status:'启用'},{id:'D004',name:'财务部',parent:'无',leader:'赵敏',status:'启用'}] },
  company: { title: '企业资料', description: '维护当前租户的基础企业信息。', fields: [{key:'name',label:'企业名称'},{key:'code',label:'企业编码'},{key:'contact',label:'联系人'},{key:'phone',label:'联系电话'}], seed: [{id:'C001',name:'示例贸易有限公司',code:'DEMO-001',contact:'张伟',phone:'13800000000'}] },
  audit: { title: '操作日志', description: '查询平台操作记录。日志数据为演示数据。', fields: [{key:'operator',label:'操作人'},{key:'action',label:'操作内容'},{key:'module',label:'所属模块'},{key:'time',label:'操作时间'}], seed: [{id:'L001',operator:'张伟',action:'登录系统',module:'认证',time:'2026-10-13 09:12'},{id:'L002',operator:'李娜',action:'查询用户列表',module:'用户管理',time:'2026-10-13 08:45'},{id:'L003',operator:'张伟',action:'更新角色权限',module:'权限管理',time:'2026-10-12 16:30'}] },
  dictionaries: { title: '字典管理', description: '维护状态、类型等基础字典项。', fields: [{key:'type',label:'字典类型'},{key:'label',label:'显示名称'},{key:'value',label:'字典值'},{key:'status',label:'状态'}], seed: [{id:'B001',type:'user_status',label:'启用',value:'active',status:'启用'},{id:'B002',type:'user_status',label:'停用',value:'inactive',status:'启用'}] },
  menus: { title: '菜单管理', description: '查看统一菜单注册表；真实动态菜单由后端按登录用户权限返回。', fields: [{key:'name',label:'菜单名称'},{key:'path',label:'路由路径'},{key:'permission',label:'权限标识'},{key:'status',label:'状态'}], seed: [{id:'M001',name:'工作台',path:'/',permission:'dashboard:read',status:'启用'},{id:'M002',name:'用户管理',path:'/users',permission:'users:read',status:'启用'},{id:'M003',name:'租户管理',path:'/tenants',permission:'tenants:read',status:'启用'},{id:'M004',name:'角色与权限',path:'/roles',permission:'roles:read',status:'启用'}] },
  profile: { title: '个人设置', description: '维护当前演示账号的个人资料偏好。', fields: [{key:'name',label:'姓名'},{key:'account',label:'登录账号'},{key:'email',label:'邮箱'},{key:'theme',label:'界面偏好'}], seed: [{id:'P001',name:'张伟',account:'admin',email:'admin@example.com',theme:'默认'}] },
  params: { title: '系统参数', description: '管理平台级参数（演示数据）。', fields: [{key:'key',label:'参数键'},{key:'value',label:'参数值'},{key:'description',label:'说明'}], seed: [{id:'S001',key:'session.timeout',value:'7200',description:'会话有效期（秒）'},{id:'S002',key:'system.title',value:'SaaS ERP 管理平台',description:'平台标题'}] }
};
export default function LocalAdminPage({ module }: { module: string }) {
  const config = configs[module] || configs.params;
  const storageKey = `saas-erp-mock-${module}-v1`;
  const [rows, setRows] = useState<Row[]>(config.seed);
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<Row | null>(null);
  const [isNew, setIsNew] = useState(false);
  useEffect(() => {
    // 模块切换时组件实例会被 React 复用（不同路由渲染同一组件），必须重置状态
    let next = config.seed;
    try { const raw = localStorage.getItem(storageKey); if (raw) next = JSON.parse(raw); } catch { /* use seed data */ }
    setRows(next);
    setEditing(null);
    setIsNew(false);
    setKeyword('');
  }, [storageKey]);
  const persist = (next: Row[]) => { setRows(next); try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* storage may be unavailable */ } };
  const visible = useMemo(() => rows.filter(row => Object.values(row).some(value => String(value).toLowerCase().includes(keyword.toLowerCase()))), [rows, keyword]);
  const startNew = () => { setIsNew(true); const initial: Row = { id: `${module.toUpperCase()}${Date.now().toString().slice(-5)}` }; config.fields.forEach(field => { initial[field.key] = ''; }); setEditing(initial); };
  const save = () => { if (!editing) return; const missing = config.fields.find(f => !String(editing[f.key] || '').trim()); if (missing) { notify(`请填写${missing.label}`, 'error'); return; } const next = isNew ? [editing, ...rows] : rows.map(row => row.id === editing.id ? editing : row); persist(next); setEditing(null); notify(isNew ? '新增成功' : '保存成功', 'success'); };
  const remove = (row: Row) => { if (!window.confirm(`确定删除“${row[config.fields[0].key]}”吗？`)) return; persist(rows.filter(item => item.id !== row.id)); notify('删除成功', 'success'); };
  return <div><div className="roles-heading"><div><h1 className="page-title">{config.title}</h1><p className="page-desc">{config.description}</p></div><button className="primary-button" onClick={startNew}>＋ 新增</button></div>
    <section className="panel"><div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}><input aria-label="搜索" value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="输入关键字搜索" style={{minWidth:220,padding:'9px 12px',border:'1px solid #d9e0ea',borderRadius:8}}/><button className="secondary-button" onClick={()=>setKeyword('')}>重置</button><span className="muted" style={{alignSelf:'center'}}>共 {visible.length} 条</span></div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}><thead><tr>{config.fields.map(f=><th key={f.key} style={{textAlign:'left',padding:12,borderBottom:'1px solid #e7ebf1',whiteSpace:'nowrap'}}>{f.label}</th>)}<th style={{textAlign:'right',padding:12,borderBottom:'1px solid #e7ebf1'}}>操作</th></tr></thead><tbody>{visible.map(row=><tr key={row.id}>{config.fields.map(f=><td key={f.key} style={{padding:12,borderBottom:'1px solid #f0f2f6'}}>{row[f.key] || '—'}</td>)}<td style={{padding:12,borderBottom:'1px solid #f0f2f6',textAlign:'right',whiteSpace:'nowrap'}}><button className="secondary-button" onClick={()=>{setIsNew(false);setEditing({...row});}}>编辑</button> <button className="secondary-button" onClick={()=>remove(row)}>删除</button></td></tr>)}{visible.length===0&&<tr><td colSpan={config.fields.length+1} style={{padding:28,textAlign:'center',color:'#7b8798'}}>没有匹配的数据</td></tr>}</tbody></table></div></section>
    {editing&&<div role="dialog" aria-modal="true" aria-label={`${config.title}编辑`} style={{position:'fixed',inset:0,background:'#17203366',zIndex:1000,display:'grid',placeItems:'center',padding:20}}><div className="panel" style={{width:'min(560px,100%)',maxHeight:'90vh',overflow:'auto',boxShadow:'0 18px 60px #17203333'}}><h3 style={{marginTop:0}}>{isNew?'新增':'编辑'}{config.title}</h3><div style={{display:'grid',gap:14}}>{config.fields.map(f=><label key={f.key} className="field-label">{f.label}<input value={editing[f.key]||''} onChange={e=>setEditing({...editing,[f.key]:e.target.value})} placeholder={f.placeholder||`请输入${f.label}`} /></label>)}</div><div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:22}}><button className="secondary-button" onClick={()=>setEditing(null)}>取消</button><button className="primary-button" onClick={save}>保存</button></div></div></div>}
  </div>;
}
