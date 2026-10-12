import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { AlertCircle } from 'lucide-react';

export const ALLOWED_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'STORE_MANAGER',
  'SALES_STAFF',
  'CATALOG_MANAGER',
  'INVENTORY_MANAGER',
  'AUDITOR',
  'MARKETING',
];

export function LoginPage() {
  const [email, setEmail] = useState('admin@jewellery.com');
  const [password, setPassword] = useState('Admin@1234');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  // Automatically clear any stale wholesale or customer sessions on login page visit
  useEffect(() => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser && !ALLOWED_ADMIN_ROLES.includes(currentUser.role)) {
      useAuthStore.getState().logout();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await authApi.login(email, password);
      const data = res.data?.data;
      if (data?.accessToken && data?.user) {
        if (!ALLOWED_ADMIN_ROLES.includes(data.user.role)) {
          setErrorMsg(
            `Access Denied: Your account role (${data.user.role}) is not authorized for the Admin ERP Portal. Please sign in with an administrator account (e.g. admin@jewellery.com).`
          );
          useAuthStore.getState().logout();
          return;
        }

        setAuth(data.user, data.accessToken);
        navigate('/dashboard', { replace: true });
      } else {
        setErrorMsg('Invalid response from authentication server');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please verify your credentials or server status.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@jewellery.com');
    setPassword('Admin@1234');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border border-slate-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-amber-800 shadow-sm">
            <span className="text-xl">👑</span>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">JewelAdmin</CardTitle>
          <p className="text-slate-500 text-sm mt-1">Super Admin ERP & Catalog Portal</p>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <Input
              label="Email Address"
              type="email"
              required
              placeholder="admin@jewellery.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 font-mono space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Default Super Admin:</span>
                <button
                  type="button"
                  onClick={fillAdminCredentials}
                  className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold underline cursor-pointer"
                >
                  Auto-fill Admin
                </button>
              </div>
              <div>Email: <span className="font-semibold text-slate-800">admin@jewellery.com</span></div>
              <div>Password: <span className="font-semibold text-slate-800">Admin@1234</span></div>
            </div>

            <Button type="submit" className="w-full" isLoading={loading}>
              Sign In to Dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
