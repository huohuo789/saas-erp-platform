import { useEffect, useState, type ReactNode } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { render as renderAmis } from "amis";
import { api } from "./api/client";
import { useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RolesPage from "./pages/RolesPage";
import LocalAdminPage from "./pages/LocalAdminPage";
import { usersSchema } from "./schemas/users";
import { tenantsSchema } from "./schemas/tenants";
import { filterMenu, hasPermission, menuRegistry } from "./app/menuRegistry";
import { Link } from "react-router-dom";
import FeedbackHost, { notify } from "./components/FeedbackHost";

function Dashboard({ permissions = [] }: { permissions?: string[] }) {
  return (
    <>
      <h1 className="page-title">工作台</h1>
      <p className="page-desc">
        欢迎使用 SaaS ERP 管理平台。这里是企业运营与系统管理的统一入口。
      </p>
      <div className="stat-grid">
        {[
          { label: "本月销售额", value: "¥ 128,560", note: "模拟统计数据" },
          { label: "采购待审核", value: "12", note: "等待处理" },
          { label: "库存预警", value: "8", note: "建议尽快检查" },
          { label: "企业成员", value: "18", note: "当前租户成员" },
        ].map((x) => (
          <div className="stat-card" key={x.label}>
            <div className="stat-label">{x.label}</div>
            <div className="stat-value">{x.value}</div>
            <div className="stat-note">{x.note}</div>
          </div>
        ))}
      </div>
      <div className="panel">
        <h3>常用功能</h3>
        <div className="quick-grid">
          {menuRegistry
            .filter((item) => item.path !== "/")
            .filter((item) => hasPermission(permissions, item.permission))
            .slice(0, 8)
            .map((item) => (
              <Link
                className="quick-item"
                key={item.key}
                to={item.path}
                style={{
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                {item.icon}　{item.label}
                <div className="muted" style={{ marginTop: 8 }}>
                  点击进入模块　→
                </div>
              </Link>
            ))}
        </div>
      </div>
      <div className="panel" style={{ marginTop: 18 }}>
        <h3>开发环境状态</h3>
        <p>
          <span className="status">
            {api.useMock ? "Mock 模式已启用" : "真实 API 模式"}
          </span>{" "}
          <span className="muted" style={{ marginLeft: 8 }}>
            数据通过统一 API 客户端访问。
          </span>
        </p>
      </div>
    </>
  );
}

function AmisPage({ schema }: { schema: any }) {
  const { user } = useAuth();
  const permissions = user?.permissions || [];
  const amisData = {
    canCreate: hasPermission(
      permissions,
      schema?.body?.[0]?.name?.includes("users")
        ? "users:create"
        : "tenants:create",
    ),
    canUpdate: hasPermission(
      permissions,
      schema?.body?.[0]?.name?.includes("users")
        ? "users:update"
        : "tenants:update",
    ),
    canDelete: hasPermission(
      permissions,
      schema?.body?.[0]?.name?.includes("users")
        ? "users:delete"
        : "tenants:delete",
    ),
  };
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) return <div className="panel">页面加载中…</div>;
  return (
    <div className="panel amis-host">
      {renderAmis(
        schema,
        { data: amisData },
        {
          fetcher: async (config: any) => {
            try {
              const url = String(config.url || "");
              const method = String(config.method || "get").toLowerCase();
              const parsed = new URL(url, window.location.origin);
              const path =
                parsed.pathname.replace(/^\/api\/v1/, "").replace(/\/$/, "") ||
                "/";
              const query: Record<string, any> = Object.fromEntries(
                parsed.searchParams.entries(),
              );
              const body =
                config.data && typeof config.data === "object"
                  ? config.data
                  : {};
              Object.assign(query, body);
              let data: any = null;

              if (path === "/platform/roles/options" && method === "get") {
                data = { options: await api.getRoleOptions() };
              } else if (path.startsWith("/users")) {
                const id = path.split("/")[2];
                if (method === "get" && id) data = await api.getUser(id);
                else if (method === "get") data = await api.getUsers(query);
                else if (method === "post") data = await api.createUser(body);
                else if (method === "put" && id)
                  data = await api.updateUser(id, body);
                else if (method === "delete" && path.endsWith("/bulk")) {
                  await api.deleteUsers(
                    Array.isArray(body.ids)
                      ? body.ids
                      : String(body.ids || "")
                          .split(",")
                          .filter(Boolean),
                  );
                  data = { success: true };
                } else if (method === "delete" && id) {
                  await api.deleteUsers([id]);
                  data = { success: true };
                }
              } else if (path.startsWith("/platform/tenants")) {
                const id = path.split("/")[3];
                if (method === "get" && id) data = await api.getTenant(id);
                else if (method === "get") data = await api.getTenants(query);
                else if (method === "post") data = await api.createTenant(body);
                else if (method === "put" && id)
                  data = await api.updateTenant(id, body);
                else if (method === "delete" && path.endsWith("/bulk")) {
                  await api.deleteTenants(
                    Array.isArray(body.ids)
                      ? body.ids
                      : String(body.ids || "")
                          .split(",")
                          .filter(Boolean),
                  );
                  data = { success: true };
                } else if (method === "delete" && id) {
                  await api.deleteTenants([id]);
                  data = { success: true };
                }
              }

              if (data === null)
                throw new Error(
                  `未配置该 Mock 接口：${method.toUpperCase()} ${path}`,
                );
              return {
                status: 0,
                ok: true,
                statusText: "OK",
                headers: {},
                data: { status: 0, msg: "success", data },
              };
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "请求失败，请稍后重试。";
              notify(message, "error");
              return {
                status: 1,
                ok: false,
                statusText: message,
                headers: {},
                data: { status: 1, msg: message, data: null },
              };
            }
          },
        },
      )}
    </div>
  );
}

function Settings() {
  return (
    <>
      <h1 className="page-title">系统设置</h1>
      <p className="page-desc">平台运行配置与开发环境信息。</p>
      <div className="panel">
        <h3>运行环境</h3>
        <p>
          <strong>数据模式：</strong>
          {api.useMock ? "Mock 模拟数据" : "真实 API"}
        </p>
        <p>
          <strong>API 前缀：</strong>
          {import.meta.env.VITE_API_BASE_URL || "/api/v1"}
        </p>
        <p className="muted">
          真实环境下请由后端实施身份认证、租户隔离与权限校验。
        </p>
      </div>
    </>
  );
}

function AccessDenied() {
  return (
    <>
      <h1 className="page-title">无权访问</h1>
      <p className="page-desc">当前账号没有访问此模块的权限，请联系管理员。</p>
    </>
  );
}

function PermissionRoute({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const { user } = useAuth();
  return hasPermission(user?.permissions, permission) ? (
    <>{children}</>
  ) : (
    <AccessDenied />
  );
}

function AppShell() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const visibleMenus = filterMenu(menuRegistry, user?.permissions);
  const currentMenu = menuRegistry.find(
    (item) => item.path === location.pathname,
  );
  const groups = [...new Set(visibleMenus.map((item) => item.group))];
  return (
    <div className={`app-shell${collapsed ? " sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand">{collapsed ? "◈" : "◈ SaaS ERP"}</div>
        {groups.map((group) => (
          <section key={group}>
            <div className="nav-label">{group}</div>
            {visibleMenus
              .filter((item) => item.group === group)
              .map((item) => (
                <NavLink
                  key={item.key}
                  end={item.path === "/"}
                  className="nav-link"
                  to={item.path}
                  title={item.label}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.label}</span>
                </NavLink>
              ))}
          </section>
        ))}
        <div className="nav-label">业务模块（规划中）</div>
        <div className="nav-link disabled-link">采购 / 销售 / 库存</div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              type="button"
              className="collapse-btn"
              onClick={() => setCollapsed((v) => !v)}
              title={collapsed ? "展开菜单" : "收起菜单"}
            >
              {collapsed ? "»" : "«"}
            </button>
            <strong>{currentMenu?.label || "SaaS ERP"}</strong>
            <small>SaaS 基础平台</small>
          </div>
          <div className="topbar-user">
            <span>
              {user?.tenantName}　·　{user?.name}
            </span>
            <button className="logout-button" onClick={logout}>
              退出登录
            </button>
          </div>
        </header>
        <main className="content">
          <Routes>
            <Route
              path="/"
              element={
                <PermissionRoute permission="dashboard:read">
                  <Dashboard permissions={user?.permissions || []} />
                </PermissionRoute>
              }
            />
            <Route
              path="/users"
              element={
                <PermissionRoute permission="users:read">
                  <AmisPage schema={usersSchema} />
                </PermissionRoute>
              }
            />
            <Route
              path="/tenants"
              element={
                <PermissionRoute permission="tenants:read">
                  <AmisPage schema={tenantsSchema} />
                </PermissionRoute>
              }
            />
            <Route
              path="/roles"
              element={
                <PermissionRoute permission="roles:read">
                  <RolesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/departments"
              element={
                <PermissionRoute permission="departments:read">
                  <LocalAdminPage module="departments" />
                </PermissionRoute>
              }
            />
            <Route
              path="/company"
              element={
                <PermissionRoute permission="company:read">
                  <LocalAdminPage module="company" />
                </PermissionRoute>
              }
            />
            <Route
              path="/menus"
              element={
                <PermissionRoute permission="menus:read">
                  <LocalAdminPage module="menus" />
                </PermissionRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <PermissionRoute permission="audit:read">
                  <LocalAdminPage module="audit" />
                </PermissionRoute>
              }
            />
            <Route
              path="/system-params"
              element={
                <PermissionRoute permission="settings:read">
                  <LocalAdminPage module="params" />
                </PermissionRoute>
              }
            />
            <Route
              path="/dictionaries"
              element={
                <PermissionRoute permission="settings:read">
                  <LocalAdminPage module="dictionaries" />
                </PermissionRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PermissionRoute permission="profile:read">
                  <LocalAdminPage module="profile" />
                </PermissionRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PermissionRoute permission="settings:read">
                  <Settings />
                </PermissionRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <FeedbackHost />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<AppShell />} />
      </Route>
    </Routes>
  );
}
