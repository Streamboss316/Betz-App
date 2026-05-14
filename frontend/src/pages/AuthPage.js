import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowRight, Fingerprint, Eye, EyeOff, ShieldCheck, Zap } from 'lucide-react';
import BiometricPrompt from '../components/BiometricPrompt';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BG_IMAGE =
  'https://images.unsplash.com/photo-1577953028264-b6a243477b38?w=1800&q=85&auto=format&fit=crop';

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricEmail, setBiometricEmail] = useState('');

  useEffect(() => {
    const enabled = localStorage.getItem('biometric_enabled') === 'true';
    const email = localStorage.getItem('biometric_user_email');
    setBiometricEnabled(enabled);
    if (email) setBiometricEmail(email);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;
      const res = await axios.post(`${API}${endpoint}`, payload);
      onLogin(res.data.access_token, res.data.user);
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      if (
        !isLogin ||
        (!localStorage.getItem('biometric_prompt_shown') && !localStorage.getItem('biometric_enabled'))
      ) {
        setTimeout(() => setShowBiometricPrompt(true), 1000);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    toast.info('Authenticating with Face ID...');
    setTimeout(async () => {
      try {
        const biometricToken = localStorage.getItem('biometric_auth_token');
        if (!biometricToken) {
          toast.error('Please login with password first to enable biometric');
          setLoading(false);
          return;
        }
        const res = await axios.post(`${API}/auth/biometric-login`, {
          email: biometricEmail,
          biometric_token: biometricToken,
        });
        onLogin(res.data.access_token, res.data.user);
        toast.success('Welcome back!');
      } catch (error) {
        localStorage.removeItem('biometric_auth_token');
        localStorage.removeItem('biometric_enabled');
        toast.error('Biometric session expired. Please login with password.');
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050505] font-body text-white">
      {/* === FULL-BLEED CINEMATIC BACKGROUND === */}
      <div className="fixed inset-0 z-0">
        <img
          src={BG_IMAGE}
          alt="Drag race — two cars at the staging line"
          className="absolute inset-0 h-full w-full object-cover opacity-80"
          style={{ filter: 'contrast(1.08) saturate(1.05)' }}
        />
        {/* purple→gold ambient wash */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 25% 20%, rgba(168,85,247,0.20), transparent 55%), radial-gradient(circle at 80% 75%, rgba(251,191,36,0.16), transparent 55%)',
          }}
        />
        {/* dark gradient for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/85 via-[#050505]/55 to-[#050505]" />

        {/* === STAGING TREE (CHRISTMAS TREE) — unmistakable drag-race symbol === */}
        <svg
          aria-hidden="true"
          viewBox="0 0 100 360"
          className="pointer-events-none absolute left-3 top-1/2 z-[1] h-[70vh] max-h-[640px] w-auto -translate-y-1/2 opacity-90 md:left-10"
        >
          {/* mounting pole */}
          <rect x="46" y="0" width="8" height="360" fill="#1a1a1c" stroke="rgba(255,255,255,0.08)" />
          {/* PRE-STAGE (small white) */}
          <circle cx="35" cy="30" r="5" fill="#e7e5e4" opacity="0.95">
            <animate attributeName="opacity" values="0.4;0.95;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="65" cy="30" r="5" fill="#e7e5e4" opacity="0.95">
            <animate attributeName="opacity" values="0.95;0.4;0.95" dur="2s" repeatCount="indefinite" />
          </circle>
          {/* STAGE (small white) */}
          <circle cx="35" cy="55" r="5" fill="#fafafa">
            <animate attributeName="fill" values="#3f3f46;#fafafa;#3f3f46" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="65" cy="55" r="5" fill="#fafafa">
            <animate attributeName="fill" values="#fafafa;#3f3f46;#fafafa" dur="3s" repeatCount="indefinite" />
          </circle>
          {/* AMBER 1 */}
          <circle cx="50" cy="105" r="18" fill="#fbbf24" style={{ filter: 'drop-shadow(0 0 16px #fbbf24)' }}>
            <animate attributeName="opacity" values="0.25;1;0.25;0.25;0.25" dur="5s" repeatCount="indefinite" />
          </circle>
          {/* AMBER 2 */}
          <circle cx="50" cy="160" r="18" fill="#fbbf24" style={{ filter: 'drop-shadow(0 0 16px #fbbf24)' }}>
            <animate attributeName="opacity" values="0.25;0.25;1;0.25;0.25" dur="5s" repeatCount="indefinite" />
          </circle>
          {/* AMBER 3 */}
          <circle cx="50" cy="215" r="18" fill="#fbbf24" style={{ filter: 'drop-shadow(0 0 16px #fbbf24)' }}>
            <animate attributeName="opacity" values="0.25;0.25;0.25;1;0.25" dur="5s" repeatCount="indefinite" />
          </circle>
          {/* GREEN — GO! */}
          <circle cx="50" cy="275" r="18" fill="#22c55e" style={{ filter: 'drop-shadow(0 0 22px #22c55e)' }}>
            <animate attributeName="opacity" values="0.2;0.2;0.2;0.2;1" dur="5s" repeatCount="indefinite" />
          </circle>
          {/* RED — Foul */}
          <circle cx="50" cy="335" r="14" fill="#ef4444" opacity="0.2" />
        </svg>

        {/* tire-smoke drift */}
        <div className="smoke-trail" style={{ top: '20%' }} />
        <div className="smoke-trail s2" />
        <div className="smoke-trail s3" />
        {/* scan line */}
        <div className="scan-line" />
        {/* faint grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* === TOP MARQUEE — race ticker === */}
      <div className="relative z-10 overflow-hidden border-b border-white/5 bg-black/40 py-2 backdrop-blur-md">
        <div className="betz-marquee flex whitespace-nowrap text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4">
              <span>● Live P2P Betting</span>
              <span className="text-[#22c55e]">● Bet Secure. Get Paid.</span>
              <span>● Trusted Decision Person</span>
              <span>● 10% Punk-Out Penalty</span>
              <span className="betz-gradient-text">● 18+ Only</span>
              <span>● Verified Wins</span>
              <span>● Fast Cashouts</span>
            </div>
          ))}
        </div>
      </div>
      <div className="speed-strip top-[44px]" />

      {/* === HERO HEADER — BETZ WORDMARK ON TOP === */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-10 pb-4 md:pt-14 md:pb-6">
        <div className="relative inline-block">
          <div className="auth-glow absolute -inset-10 -z-10" />
          <h1
            data-testid="auth-title"
            className="font-heading text-7xl leading-[0.85] tracking-tight md:text-[110px]"
          >
            <span className="betz-gradient-text">BETZ</span>
          </h1>
        </div>

        {/* tagline — kept GREEN per brand spec */}
        <p className="mt-3 font-heading text-base tracking-[0.35em] uppercase text-[#22c55e] md:text-lg">
          Bet Secure. Get Paid.
        </p>

        {/* staging lights + trust pills */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md">
            <span className="stage-light h-2 w-2 rounded-full bg-white/10" />
            <span className="stage-light delay-1 h-2 w-2 rounded-full bg-white/10" />
            <span className="stage-light delay-2 h-2 w-2 rounded-full bg-white/10" />
            <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
              Staging
            </span>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-md md:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-[#a855f7]" />
            <span>Escrowed P2P Wallet</span>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-md md:flex">
            <Zap className="h-3.5 w-3.5 text-[#fbbf24]" />
            <span>Instant payouts</span>
          </div>
        </div>
      </div>

      {/* === FORM CARD — CENTERED BELOW LOGO === */}
      <div className="relative z-10 flex items-start justify-center px-4 pb-10 md:pb-16">
        <div className="w-full max-w-md">
          <div
            data-testid="auth-card"
            className="auth-card-shell relative rounded-3xl px-6 pt-7 pb-8 md:p-9"
          >
            {/* top accent line: purple → gold */}
            <div className="card-top-accent absolute left-1/2 top-0 h-[3px] w-20 -translate-x-1/2 rounded-b-full" />

            {/* segmented tabs */}
            <div className="mb-7 flex gap-1 rounded-xl border border-white/5 bg-black/50 p-1">
              <button
                type="button"
                data-testid="login-tab"
                onClick={() => setIsLogin(true)}
                className={`auth-tab ${isLogin ? 'auth-tab-active' : 'auth-tab-inactive'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                data-testid="register-tab"
                onClick={() => setIsLogin(false)}
                className={`auth-tab ${!isLogin ? 'auth-tab-active' : 'auth-tab-inactive'}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/50"
                  >
                    Driver Name
                  </label>
                  <input
                    id="name"
                    data-testid="name-input"
                    className="auth-input"
                    placeholder="Johnny Racer"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required={!isLogin}
                  />
                </div>
              )}

              {!isLogin && (
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/50"
                  >
                    Phone
                  </label>
                  <input
                    id="phone"
                    data-testid="phone-input"
                    className="auth-input"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/50"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  data-testid="email-input"
                  className="auth-input"
                  placeholder="racer@betz.app"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/50"
                  >
                    Password
                  </label>
                  {isLogin && (
                    <a
                      href="/forgot-password"
                      data-testid="forgot-password-link"
                      className="text-[10px] font-bold uppercase tracking-[0.18em] betz-gradient-text hover:opacity-80 transition-opacity"
                    >
                      Forgot?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    data-testid="password-input"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input pr-12"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="password-input-toggle-visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 text-white/50 hover:text-[#fbbf24] transition-colors"
                    aria-label="toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                data-testid="submit-button"
                disabled={loading}
                className="auth-cta mt-2"
              >
                {loading ? (
                  <span className="font-body text-sm tracking-normal">Processing...</span>
                ) : (
                  <>
                    {isLogin ? 'Launch' : 'Stage Up'}
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            {isLogin && biometricEnabled && biometricEmail && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-[#0a0a0c] px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
                      or
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={loading}
                  data-testid="biometric-login-button"
                  className="auth-secondary-btn"
                >
                  <Fingerprint className="h-5 w-5 text-[#a855f7]" />
                  Sign in with Face ID
                </button>
              </>
            )}

            <p className="mt-7 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
              Must be 18+ to use BETZ
            </p>

            <div className="mt-3 flex justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">
              <a href="/privacy" className="hover:text-[#fbbf24] transition-colors">
                Privacy
              </a>
              <span>•</span>
              <a href="/terms" className="hover:text-[#fbbf24] transition-colors">
                Terms
              </a>
              <span>•</span>
              <a href="/contact" className="hover:text-[#fbbf24] transition-colors">
                Contact
              </a>
            </div>

            <div className="mt-4 text-center">
              <a
                href="/admin/login"
                className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/35 hover:text-[#a855f7] transition-colors"
              >
                Admin? Login here →
              </a>
            </div>
          </div>
        </div>
      </div>

      {showBiometricPrompt && (
        <BiometricPrompt
          userEmail={formData.email}
          onClose={() => setShowBiometricPrompt(false)}
        />
      )}
    </div>
  );
}
