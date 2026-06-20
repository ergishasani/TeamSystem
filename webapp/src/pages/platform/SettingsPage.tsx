import { useEffect, useRef, useState } from 'react';
import { Palette, Globe2, ShieldCheck, Plus } from 'lucide-react';
import { settingsApi } from '../../lib/api';

interface BrandColors { primary: string; accent: string; light: string; warn: string; }
interface Policies {
  auto_approve_under: number; require_signoff_above: number;
  lock_wallet_at_cap: boolean; ai_bundle_suggestions: boolean;
}
interface NotificationPrefs {
  new_requests: boolean; daily_drop_recap: boolean; provider_downtime: boolean; weekly_digest: boolean;
}
interface SecurityPrefs {
  enforce_sso: boolean; require_2fa_admins: boolean; ip_allowlist: boolean; last_security_review: string | null;
}
interface Workspace {
  id: number; name: string; trading_name: string | null; city: string | null;
  country: string; currency: string; support_email: string | null; support_phone: string | null;
  logo_url: string | null; brand_colors: BrandColors; language: string; timezone: string;
  week_start: string; number_format: string; policies: Policies;
  notification_prefs: NotificationPrefs; security_prefs: SecurityPrefs; seats: number;
}
interface ConnectedWorkspace { id: number; name: string; seats: number; is_primary: boolean; }

function fmtDate(iso: string | null) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Reusable bits ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full flex-shrink-0 transition-colors relative ${checked ? 'bg-[#1a1a1a]' : 'bg-[#e5e0d8]'}`}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  );
}

function PolicyRow({ title, sub, checked, onChange }: { title: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-[#faf8f5] rounded-xl px-4 py-3">
      <div className="min-w-0">
        <p className="text-[#1a1a1a] text-sm font-bold">{title}</p>
        <p className="text-[#aaa] text-xs mt-0.5">{sub}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function Field({ label, value, onCommit, suffix }: { label: string; value: string; onCommit: (v: string) => void; suffix?: string }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div>
      <p className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider mb-1.5">{label}</p>
      <div className="relative">
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => { if (v !== value) onCommit(v); }}
          className="w-full bg-[#f5f2ec] rounded-xl px-4 py-2.5 text-sm text-[#1a1a1a] font-medium outline-none focus:ring-2 focus:ring-[#1a1a1a]/10"
        />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#aaa] text-xs">{suffix}</span>}
      </div>
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider mb-1.5">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#f5f2ec] rounded-xl px-4 py-2.5 text-sm text-[#1a1a1a] font-medium outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 appearance-none"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [ws, setWs] = useState<Workspace | null>(null);
  const [connected, setConnected] = useState<ConnectedWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [editingColorKey, setEditingColorKey] = useState<keyof BrandColors | null>(null);

  useEffect(() => {
    Promise.allSettled([settingsApi.workspace(), settingsApi.workspaces()]).then(([wR, cR]) => {
      if (wR.status === 'fulfilled') setWs(wR.value.data as Workspace);
      if (cR.status === 'fulfilled') setConnected(cR.value.data as ConnectedWorkspace[]);
      setLoading(false);
    });
  }, []);

  const flashSaved = () => { setSavedAt(Date.now()); setTimeout(() => setSavedAt(null), 1500); };

  const patchWorkspace = (data: Partial<Workspace>) => {
    if (!ws) return;
    setWs({ ...ws, ...data });
    settingsApi.updateWorkspace(data as never).then(() => flashSaved());
  };
  const patchBrand = (data: { logo_url?: string; brand_colors?: Partial<BrandColors> }) => {
    if (!ws) return;
    const nextColors = { ...ws.brand_colors, ...(data.brand_colors ?? {}) };
    setWs({ ...ws, logo_url: data.logo_url ?? ws.logo_url, brand_colors: nextColors });
    settingsApi.updateBrand(data).then(() => flashSaved());
  };
  const patchLocalization = (data: Partial<Workspace>) => {
    if (!ws) return;
    setWs({ ...ws, ...data });
    settingsApi.updateLocalization(data as never).then(() => flashSaved());
  };
  const patchPolicies = (data: Partial<Policies>) => {
    if (!ws) return;
    const next = { ...ws.policies, ...data };
    setWs({ ...ws, policies: next });
    settingsApi.updatePolicies(data).then(() => flashSaved());
  };
  const patchNotifications = (data: Partial<NotificationPrefs>) => {
    if (!ws) return;
    const next = { ...ws.notification_prefs, ...data };
    setWs({ ...ws, notification_prefs: next });
    settingsApi.updateNotifications(data).then(() => flashSaved());
  };
  const patchSecurity = (data: Partial<SecurityPrefs>) => {
    if (!ws) return;
    const next = { ...ws.security_prefs, ...data };
    setWs({ ...ws, security_prefs: next as SecurityPrefs });
    settingsApi.updateSecurity(data).then(() => flashSaved());
  };

  const onLogoFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => patchBrand({ logo_url: reader.result as string });
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-[#e8e3db]/60 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!ws) {
    return <div className="bg-white border border-[#ede9e2] rounded-2xl p-10 text-center text-[#aaa]">Couldn't load settings.</div>;
  }

  const initials = ws.name.slice(0, 1).toUpperCase();
  const colorKeys: { key: keyof BrandColors; label: string }[] = [
    { key: 'primary', label: 'primary' }, { key: 'accent', label: 'accent' },
    { key: 'light', label: 'light' }, { key: 'warn', label: 'warn' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#1a1a1a] text-2xl font-black tracking-tight">Settings</h2>
          <p className="text-[#aaa] text-sm mt-0.5">Workspace identity, policies, notifications, and security</p>
        </div>
        {savedAt && <span className="text-emerald-600 text-xs font-bold">Saved</span>}
      </div>

      {/* Row 1: Workspace + Brand */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-[#ede9e2] rounded-2xl p-6">
          <h3 className="text-[#1a1a1a] font-black text-lg">Workspace</h3>
          <p className="text-[#aaa] text-sm mt-0.5 mb-5">Public identity for your Perka account</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company" value={ws.name} onCommit={(v) => patchWorkspace({ name: v })} />
            <Field label="Trading name" value={ws.trading_name ?? ''} onCommit={(v) => patchWorkspace({ trading_name: v })} />
            <Field label="Primary city" value={ws.city ?? ''} onCommit={(v) => patchWorkspace({ city: v })} />
            <div>
              <p className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                Currency <span className="text-[#ccc]">Display only</span>
              </p>
              <div className="w-full bg-[#f5f2ec]/60 rounded-xl px-4 py-2.5 text-sm text-[#888] font-medium">{ws.currency}</div>
            </div>
            <Field label="Support email" value={ws.support_email ?? ''} onCommit={(v) => patchWorkspace({ support_email: v })} />
            <Field label="Support phone" value={ws.support_phone ?? ''} onCommit={(v) => patchWorkspace({ support_phone: v })} />
          </div>
        </div>

        <div className="bg-[#0b1416] rounded-2xl p-6">
          <h3 className="text-white font-black text-lg mb-5">Brand</h3>
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ background: ws.brand_colors.accent }}
            >
              {ws.logo_url
                ? <img src={ws.logo_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl font-black text-[#111]">{initials}</span>}
            </div>
            <div>
              <button
                onClick={() => logoInputRef.current?.click()}
                className="bg-[#c4f24a] text-[#1a1a1a] text-xs font-bold px-3.5 py-1.5 rounded-full hover:bg-[#b8e63e] transition-colors"
              >
                Upload logo
              </button>
              <p className="text-[#666] text-[11px] mt-1">PNG or SVG · 512×512</p>
              <input
                ref={logoInputRef} type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onLogoFile(f); }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            {colorKeys.map(({ key, label }) => (
              <button key={key} onClick={() => { setEditingColorKey(key); colorInputRef.current?.click(); }} className="text-center">
                <span
                  className="w-9 h-9 rounded-full block border border-white/10"
                  style={{ background: ws.brand_colors[key] }}
                />
                <span className="text-[#666] text-[10px] mt-1.5 block font-mono">{ws.brand_colors[key]}</span>
              </button>
            ))}
          </div>
          <input
            ref={colorInputRef} type="color" className="hidden"
            value={editingColorKey ? ws.brand_colors[editingColorKey] : '#000000'}
            onChange={(e) => { if (editingColorKey) patchBrand({ brand_colors: { [editingColorKey]: e.target.value } as Partial<BrandColors> }); }}
          />
          <button
            onClick={() => colorInputRef.current?.click()}
            className="flex items-center gap-1.5 text-[#c4f24a] text-xs font-bold mt-4 hover:underline"
          >
            <Palette size={13} /> Edit theme tokens
          </button>
        </div>
      </div>

      {/* Row 2: Localization + Operational policies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[#ede9e2] rounded-2xl p-6">
          <h3 className="text-[#1a1a1a] font-black text-lg flex items-center gap-2"><Globe2 size={17} /> Localization</h3>
          <p className="text-[#aaa] text-sm mt-0.5 mb-5">Defaults applied to all employees</p>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Language" value={ws.language}
              options={[{ value: 'sq', label: 'Shqip' }, { value: 'en', label: 'English' }]}
              onChange={(v) => patchLocalization({ language: v })}
            />
            <Select
              label="Timezone" value={ws.timezone}
              options={[{ value: 'Europe/Tirane', label: 'Europe/Tirane' }, { value: 'Europe/London', label: 'Europe/London' }]}
              onChange={(v) => patchLocalization({ timezone: v })}
            />
            <Select
              label="Week start" value={ws.week_start}
              options={[{ value: 'monday', label: 'Monday' }, { value: 'sunday', label: 'Sunday' }]}
              onChange={(v) => patchLocalization({ week_start: v })}
            />
            <Select
              label="Number format" value={ws.number_format}
              options={[
                { value: 'space_comma', label: '1 234,56' },
                { value: 'comma_dot', label: '1,234.56' },
                { value: 'dot_comma', label: '1.234,56' },
              ]}
              onChange={(v) => patchLocalization({ number_format: v })}
            />
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 bg-[#faf8f5] rounded-full px-3 py-1.5">
            <Globe2 size={12} className="text-[#aaa]" />
            <span className="text-[#888] text-xs font-medium">Multi-region · {connected.length} {connected.length === 1 ? 'city' : 'cities'} live</span>
          </div>
        </div>

        <div className="bg-white border border-[#ede9e2] rounded-2xl p-6">
          <h3 className="text-[#1a1a1a] font-black text-lg mb-5">Operational policies</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 bg-[#faf8f5] rounded-xl px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[#1a1a1a] text-sm font-bold">
                  Auto-approve under{' '}
                  <input
                    type="number"
                    defaultValue={ws.policies.auto_approve_under}
                    onBlur={(e) => patchPolicies({ auto_approve_under: Number(e.target.value) })}
                    className="w-20 bg-white border border-[#ede9e2] rounded-md px-1.5 py-0.5 text-sm font-bold text-center"
                  />{' '}ALL
                </p>
                <p className="text-[#aaa] text-xs mt-0.5">Skips manual review for trusted vendors</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 bg-[#faf8f5] rounded-xl px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[#1a1a1a] text-sm font-bold">
                  Require manager sign-off &gt;{' '}
                  <input
                    type="number"
                    defaultValue={ws.policies.require_signoff_above}
                    onBlur={(e) => patchPolicies({ require_signoff_above: Number(e.target.value) })}
                    className="w-20 bg-white border border-[#ede9e2] rounded-md px-1.5 py-0.5 text-sm font-bold text-center"
                  />{' '}ALL
                </p>
                <p className="text-[#aaa] text-xs mt-0.5">Adds an extra approver</p>
              </div>
            </div>
            <PolicyRow
              title="Lock wallet at 95% cap" sub="Block new spend, allow redemptions"
              checked={ws.policies.lock_wallet_at_cap} onChange={(v) => patchPolicies({ lock_wallet_at_cap: v })}
            />
            <PolicyRow
              title="Surface AI bundle suggestions" sub="Daily proposals in Approvals"
              checked={ws.policies.ai_bundle_suggestions} onChange={(v) => patchPolicies({ ai_bundle_suggestions: v })}
            />
          </div>
        </div>
      </div>

      {/* Row 3: Notifications + Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[#ede9e2] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[#1a1a1a] font-black text-lg">Notifications</h3>
            <a href="/platform/notifications" className="text-[#888] hover:text-[#1a1a1a] text-xs font-semibold transition-colors">Open center →</a>
          </div>
          <div className="space-y-3">
            <PolicyRow title="New perk requests" sub="Email + in-app to admins" checked={ws.notification_prefs.new_requests} onChange={(v) => patchNotifications({ new_requests: v })} />
            <PolicyRow title="Daily Drop performance" sub="Morning recap at 09:00" checked={ws.notification_prefs.daily_drop_recap} onChange={(v) => patchNotifications({ daily_drop_recap: v })} />
            <PolicyRow title="Provider downtime" sub="Slack alert to #perka-ops" checked={ws.notification_prefs.provider_downtime} onChange={(v) => patchNotifications({ provider_downtime: v })} />
            <PolicyRow title="Weekly executive digest" sub="Sent every Monday" checked={ws.notification_prefs.weekly_digest} onChange={(v) => patchNotifications({ weekly_digest: v })} />
          </div>
          <p className="text-[#aaa] text-xs font-medium mt-4">🔔 Slack + Email configured</p>
        </div>

        <div className="bg-white border border-[#ede9e2] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[#1a1a1a] font-black text-lg">Security</h3>
          </div>
          <div className="space-y-3">
            <PolicyRow title="Enforce SSO (Google Workspace)" sub="All staff sign in via SSO" checked={ws.security_prefs.enforce_sso} onChange={(v) => patchSecurity({ enforce_sso: v })} />
            <PolicyRow title="2-factor for admins" sub="TOTP or hardware key" checked={ws.security_prefs.require_2fa_admins} onChange={(v) => patchSecurity({ require_2fa_admins: v })} />
            <PolicyRow title="IP allowlist" sub="Restrict admin console access" checked={ws.security_prefs.ip_allowlist} onChange={(v) => patchSecurity({ ip_allowlist: v })} />
          </div>
          <div className="flex items-center gap-1.5 bg-[#faf8f5] rounded-xl px-4 py-2.5 mt-4">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span className="text-[#555] text-xs font-medium">Last security review · {fmtDate(ws.security_prefs.last_security_review)}</span>
          </div>
        </div>
      </div>

      {/* Connected workspaces */}
      <div className="bg-white border border-[#ede9e2] rounded-2xl p-6">
        <h3 className="text-[#1a1a1a] font-black text-lg">Connected workspaces</h3>
        <p className="text-[#aaa] text-sm mt-0.5 mb-5">Companies linked to this Perka tenant</p>
        <div className="flex flex-wrap gap-3">
          {connected.map((c) => (
            <div key={c.id} className="flex items-center gap-3 bg-[#faf8f5] border border-[#f0ece4] rounded-2xl px-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-black">{c.name.slice(0, 1).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-[#1a1a1a] text-sm font-bold">{c.name}</p>
                <p className="text-[#aaa] text-[11px] font-semibold uppercase tracking-wide">
                  {c.is_primary ? 'Primary' : 'Subsidiary'} · {c.seats} seats
                </p>
              </div>
            </div>
          ))}
          <button
            disabled
            className="flex items-center gap-1.5 border border-dashed border-[#ddd] rounded-2xl px-4 py-3 text-[#bbb] text-sm font-semibold cursor-not-allowed"
            title="Multi-tenant workspace creation isn't available yet"
          >
            <Plus size={14} /> Add workspace
          </button>
        </div>
      </div>
    </div>
  );
}
