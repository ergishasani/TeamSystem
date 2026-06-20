import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Employer Admin', email: 'admin@tiranatech.al', password: 'password123', role: 'Employer · Platform' },
  { label: 'Provider Admin', email: 'provider@serenityspace.al', password: 'password123', role: 'Provider Portal' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  // Redirect already-logged-in users
  useEffect(() => {
    if (!user) return;
    if (user.role === 'employer_admin' || user.role === 'platform_admin') navigate('/platform', { replace: true });
    else if (user.role === 'provider_admin') navigate('/provider', { replace: true });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in both fields.'); return; }
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      const msg = err?.response?.data?.detail;
      setError(typeof msg === 'string' ? msg : 'Invalid credentials. Try again.');
    }
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#f0ece4] flex">

      {/* ── Left branding panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[45%] flex-col justify-between p-12 bg-[#1a1a1a]">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#c9f158] flex items-center justify-center">
            <span className="text-[#1a1a1a] font-black text-lg leading-none">P</span>
          </div>
          <span className="text-white font-black text-xl tracking-tight">Perka</span>
        </div>

        {/* Middle copy */}
        <div className="space-y-6">
          <p className="text-[rgba(255,255,255,0.3)] text-[11px] font-bold uppercase tracking-[0.2em]">
            Employee Benefits Platform
          </p>
          <h1 className="text-white text-4xl font-black leading-tight tracking-tight">
            Your team's benefits,<br />
            <span className="text-[#c9f158]">beautifully managed.</span>
          </h1>
          <p className="text-[rgba(255,255,255,0.45)] text-sm leading-relaxed max-w-xs">
            One platform for employers to approve, track, and grow their employee benefit programmes — connected live to the mobile app.
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { n: '284', label: 'Active Users' },
            { n: '98%', label: 'Satisfaction' },
            { n: '40+', label: 'Providers' },
          ].map(s => (
            <div key={s.label} className="bg-[rgba(255,255,255,0.05)] rounded-2xl p-4">
              <p className="text-white text-2xl font-black">{s.n}</p>
              <p className="text-[rgba(255,255,255,0.35)] text-xs mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
              <span className="text-[#c9f158] font-black text-base leading-none">P</span>
            </div>
            <span className="text-[#1a1a1a] font-black text-lg tracking-tight">Perka</span>
          </div>

          <div className="mb-8">
            <h2 className="text-[#1a1a1a] text-3xl font-black tracking-tight">Welcome back</h2>
            <p className="text-[#888] text-sm mt-1.5">Sign in to your admin portal</p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-3xl shadow-sm border border-[#ede9e2] p-8 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="lf-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@tiranatech.al"
                  autoComplete="email"
                  className="lf-input"
                />
              </div>

              {/* Password */}
              <div>
                <label className="lf-label">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="lf-input pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#888] transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-[#fff0f0] border border-[#fcc] rounded-xl px-4 py-3 text-[#c00] text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#2e2e2e] disabled:opacity-50 text-white font-bold py-3.5 rounded-full transition-colors text-sm mt-2"
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
                {!isLoading && <ArrowRight size={15} />}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-[#f0ece4]" />
              <span className="text-[#ccc] text-xs font-medium">or try a demo</span>
              <div className="flex-1 h-px bg-[#f0ece4]" />
            </div>

            {/* Demo accounts */}
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => fillDemo(acc)}
                  className="w-full flex items-center gap-3 bg-[#faf8f5] hover:bg-[#f0ece4] border border-[#ede9e2] rounded-2xl px-4 py-3 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                    <span className="text-[#c9f158] text-[11px] font-black">
                      {acc.label.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1a1a1a] text-sm font-bold">{acc.label}</p>
                    <p className="text-[#aaa] text-xs">{acc.role}</p>
                  </div>
                  <span className="text-[#ccc] text-[10px] font-medium">Fill →</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-[#bbb] text-xs text-center mt-6">
            Access restricted to employer and provider admins.
          </p>
        </div>
      </div>

    </div>
  );
}
