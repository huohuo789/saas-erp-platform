import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [account, setAccount] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [tenantCode, setTenantCode] = useState('demo');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  if (!loading && isAuthenticated) return <Navigate to={from} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ account: account.trim(), password, tenantCode: tenantCode.trim() || undefined });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="login-page">
    <section className="login-brand-panel">
      <div className="login-brand"><span className="brand-mark">◈</span> SaaS ERP</div>
      <div className="login-brand-copy"><div className="eyebrow">TRADE · INVENTORY · OPERATIONS</div><h1>让企业经营<br/>更简单、更清晰</h1><p>统一管理采购、销售、库存与企业协作。</p></div>
      <div className="login-brand-foot">SaaS ERP · 前端基础平台</div>
    </section>
    <section className="login-form-panel"><form className="login-card" onSubmit={handleSubmit}>
      <div className="login-heading"><h2>欢迎登录</h2><p>登录你的企业管理工作台</p></div>
      <label className="form-label" htmlFor="tenantCode">企业标识</label><input id="tenantCode" value={tenantCode} onChange={e => setTenantCode(e.target.value)} placeholder="请输入企业标识" autoComplete="organization" />
      <label className="form-label" htmlFor="account">账号</label><input id="account" value={account} onChange={e => setAccount(e.target.value)} placeholder="请输入账号" autoComplete="username" required />
      <label className="form-label" htmlFor="password">密码</label><input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" autoComplete="current-password" required />
      {error && <div className="login-error" role="alert">{error}</div>}
      <button className="login-submit" type="submit" disabled={submitting}>{submitting ? '正在登录…' : '登 录'}</button>
      <div className="demo-hint"><strong>Mock 演示账号</strong><br/>企业标识：demo　账号：admin　密码：123456</div>
      <p className="login-footnote">当前为开发演示环境，请勿使用真实密码。</p>
    </form></section>
  </div>;
}
