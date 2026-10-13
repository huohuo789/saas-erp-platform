
## 通用 CRUD 模板

平台管理页面使用 `src/schemas/crudFactory.ts` 统一生成 amis CRUD JSON Schema。每个业务页面只需定义标题、接口地址、表格列、筛选字段和表单字段，例如 `src/schemas/users.ts` 与 `src/schemas/tenants.ts`。

当前 Mock 支持用户和租户的列表查询、关键字/状态筛选、分页、新增、编辑、详情读取、单条删除和批量删除。Mock 数据仅保存在当前浏览器运行内存中，刷新页面后恢复为初始示例数据。

新增模块步骤：
1. 在 `src/types/api.ts` 定义业务数据类型。
2. 在 `src/mock/data.ts` 增加演示数据。
3. 在 `src/api/client.ts` 增加对应的列表和增删改查方法；真实模式方法应映射到后端 REST API。
4. 新建 `src/schemas/<module>.ts`，调用 `createCrudSchema()` 配置 `endpoint`、`columns`、`filters` 和 `fields`。
5. 在 `src/App.tsx` 的 `AmisPage` 路由和 fetcher 中注册对应资源，再添加菜单与路由。

统一约定：列表接口接收 `keyword`、`status`、`page`、`perPage` 等查询参数，返回 `{ items, total, page, pageSize }`；新增使用 `POST /资源`，详情使用 `GET /资源/:id`，编辑使用 `PUT /资源/:id`，删除使用 `DELETE /资源/:id`，批量删除使用 `DELETE /资源/bulk` 并提交 `{ ids: [] }`。生产环境必须在后端校验租户隔离与操作权限。

## 平台管理模块体系（本阶段）

- `src/app/menuRegistry.ts`：统一维护菜单标题、路由、图标、分组和访问权限；侧边栏和页面标题读取同一份注册表。
- `src/schemas/crudFactory.ts`：统一生成 amis CRUD Schema，支持字段、筛选项、可配置列、列显示切换、分页、表单弹窗、编辑初始化、删除确认、批量删除和操作成功/失败提示。
- `src/components/FeedbackHost.tsx`：统一显示前端错误提示；amis API 请求失败时会展示可读错误信息。
- `CurrentUser.permissions` 控制菜单、路由与新增/编辑/删除按钮的显示。当前是前端体验层控制，**真实 API 必须在后端再次校验用户权限**，不能把隐藏按钮当作安全边界。

### 新增一个 CRUD 管理模块

1. 在 `src/schemas/` 下创建模块 Schema，调用 `createCrudSchema({ ... })`。
2. 配置 `endpoint`、`columns`、`fields`、`filters` 和 `permissions`（例如 `products:read/create/update/delete`）。
3. 在 `src/app/menuRegistry.ts` 注册菜单和 `read` 权限。
4. 在 `src/App.tsx` 增加对应路由；如需 Mock 数据，在 `src/api/client.ts` 和 `AmisPage` 的 fetcher 中补充资源映射。
5. 后端应采用一致的分页格式 `{ items, total, page, pageSize }`，并为每个读写 API 做权限校验和参数验证。


## 角色、菜单权限与数据范围配置

- 进入「平台管理 → 角色与权限」，可新建/编辑角色、配置角色状态和编码。
- 菜单与操作权限按模块分组维护，权限编码如 `users:read`、`users:update`、`roles:manage`。
- 数据范围支持全部数据、本部门及下级部门、仅本部门、仅本人、自定义部门；选择自定义部门时至少勾选一个部门。
- 当前角色接口支持 Mock 内存数据；刷新页面会恢复初始示例数据。真实 API 预留：
  - `GET /api/v1/platform/roles`
  - `POST /api/v1/platform/roles`
  - `PUT /api/v1/platform/roles/{id}`
  - `DELETE /api/v1/platform/roles/{id}`
- 数据范围配置是权限模型的前端配置入口。真实后端必须将角色权限与租户 ID、部门树、业务单据负责人等规则结合，并在每个 API 请求中执行授权校验。


## 用户角色分配与动态权限

- 用户管理中的「角色」字段改为远程下拉选项，数据来自 `GET /api/v1/platform/roles/options`，只返回启用角色。
- 新增/编辑用户时会验证角色是否存在且已启用（Mock 模式）。
- Mock 登录后的权限从当前示例用户关联的启用角色读取，不再固定写死一组权限。保存角色权限后会刷新当前登录用户的权限。
- 真实 API 需提供：
  - `GET /api/v1/platform/roles/options` → `{ "options": [{ "label": "系统管理员", "value": "系统管理员" }] }`
  - `GET /api/v1/auth/me` → 返回当前用户、角色编码和最终权限编码。
  - 用户创建/更新接口应保存角色关联，而不只是接受前端传入的角色名称。
- 当前演示用户只有单角色字段，便于和现有 CRUD 模板兼容。后续如果要支持多角色，需要将用户模型升级为 `roleIds: string[]`，并在后端合并多个角色权限。

## 本次功能回归整合

统一菜单注册表 `src/app/menuRegistry.ts` 同时驱动侧边栏、工作台快捷入口和页面标题；所有快捷入口均可跳转。保留用户管理、租户管理、角色与权限及 amis CRUD Schema，并补充部门管理、企业资料、菜单管理、操作日志、系统参数、字典管理和个人设置页面。新增的通用本地管理页提供关键字搜索、重置、新增、编辑、删除、表单必填校验与本地浏览器持久化。

### Mock 登录
- 企业标识：`demo`
- 账号：`admin`
- 密码：`123456`

### 回归检查建议
1. 登录后逐个点击侧边栏菜单和工作台快捷入口，确认页面标题与路由一致。
2. 在用户管理、租户管理测试筛选、重置、新增、编辑、删除及批量删除。
3. 在角色与权限中创建角色、变更权限和数据范围，保存后刷新确认状态。
4. 在部门、企业资料、菜单、日志、参数、字典、个人设置模块测试新增/编辑/删除及刷新后的数据保留。
5. 退出登录后访问任意内部路由，应返回登录页；无权限路由应显示无权访问页面。
6. 执行 `npm install` 和 `npm run build`。当前交付环境无法完成依赖安装，因此未声称已通过 Vite 生产构建；请在可访问 npm registry 的环境执行构建验证。

> 说明：新增的部门、企业资料、菜单、日志、参数、字典和个人设置为前端 Mock 管理页面。真实业务权限、租户隔离、审计写入及数据范围必须由服务端实施，前端隐藏菜单不能作为安全边界。
