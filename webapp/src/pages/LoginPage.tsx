import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      if (user.role === 'employer_admin') navigate('/employer', { replace: true });
      else if (user.role === 'provider_admin') navigate('/provider', { replace: true });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Login failed. Check your credentials.';
      setError(typeof msg === 'string' ? msg : 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-app-accent items-center justify-center mb-4">
            <span className="text-white font-black text-2xl">P</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Perka Admin</h1>
          <p className="text-app-muted text-sm mt-1">Sign in to your management portal</p>
        </div>

        {/* Card */}
        <div className="bg-app-card border border-app-border rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-app-muted text-xs font-medium mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tiranatech.al"
                className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-app-accent text-sm transition-colors"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-app-muted text-xs font-medium mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-app-accent text-sm transition-colors pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-app-accent hover:bg-app-accent-dark disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 pt-5 border-t border-app-border">
            <p className="text-app-muted text-xs font-medium mb-3 uppercase tracking-wide">Demo accounts</p>
            <div className="space-y-2">
              <button
                onClick={() => { setEmail('admin@tiranatech.al'); setPassword('password123'); }}
                className="w-full text-left bg-app-surface hover:bg-app-border rounded-lg px-3 py-2 transition-colors"
              >
                <p className="text-white text-xs font-medium">Employer Admin</p>
                <p className="text-app-muted text-xs">admin@tiranatech.al</p>
              </button>
            </div>
          </div>
        </div>

        <p className="text-app-muted text-xs text-center mt-6">
          Access is restricted to employer and provider admins.
        </p>
      </div>
    </div>
  );
}
