import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowRight, Fingerprint, Eye, EyeOff, ShieldCheck, Zap } from 'lucide-react';
import BiometricPrompt from '../components/BiometricPrompt';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BG_IMAGE = '/auth-bg.jpg';

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
      toast.success(isLogin ? 'Welcome back' : 'Account created');
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
        toast.success('Welcome back');
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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#06070a] font-body text-white">
      {/* === BACKGROUND === */}
      <div className="fixed inset-0 z-0">
        <img
          src={BG_IMAGE}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'contrast(1.02) saturate(1.05) brightness(0.78)', opacity: 0.78 }}
        />
        {/* gentle dark wash — keeps card legible, lets photo breathe */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#06070a]/55 via-[#06070a]/35 to-[#06070a]/85" />
        {/* purple/gold ambient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 5%, rgba(168,85,247,0.16), transparent 55%), radial-gradient(circle at 50% 100%, rgba(251,191,36,0.08), transparent 55%)',
          }}
        />
      </div>

      {/* === TOP MARQUEE — race ticker === */}
      <div className="relative z-10 overflow-hidden border-b border-white/5 bg-black/45 py-2 backdrop-blur-md">
        <div className="betz-marquee flex whitespace-nowrap text-[10px] font-bold tracking-[0.3em] text-white/45 uppercase">
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

      {/* === HEADER — wordmark with glowing halo === */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-14 pb-6 md:pt-16 md:pb-8">
        <div className="relative inline-block">
          <div className="auth-glow absolute -inset-12 -z-10" />
          <h1
            data-testid="auth-title"
            className="font-heading text-6xl tracking-tight md:text-7xl"
            style={{ letterSpacing: '0.04em' }}
          >
            <span className="brand-text">BETZ</span>
          </h1>
        </div>
        <p className="mt-3 font-heading text-base tracking-[0.35em] uppercase text-[#22c55e] md:text-lg">
          Bet Secure. Get Paid.
        </p>

        {/* trust pills */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md">
            <span className="stage-light h-1.5 w-1.5 rounded-full bg-white/10" />
            <span className="stage-light delay-1 h-1.5 w-1.5 rounded-full bg-white/10" />
            <span className="stage-light delay-2 h-1.5 w-1.5 rounded-full bg-white/10" />
            <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
              Staging
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-medium text-white/75 backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5 text-[#a855f7]" />
            <span>Escrowed P2P Wallet</span>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-medium text-white/75 backdrop-blur-md md:flex">
            <Zap className="h-3.5 w-3.5 text-[#fbbf24]" />
            <span>Instant payouts</span>
          </div>
        </div>
      </div>

      {/* === FORM CARD === */}
      <div className="relative z-10 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-[420px]">
          <div
            data-testid="auth-card"
            className="auth-card-clean relative rounded-2xl px-7 pt-8 pb-8 md:px-9"
          >
            {/* segmented tabs — clean */}
            <div className="mb-7 flex gap-1 rounded-xl bg-white/[0.04] p-1 ring-1 ring-white/[0.06]">
              <button
                type="button"
                data-testid="login-tab"
                onClick={() => setIsLogin(true)}
                className={`auth-tab-clean ${isLogin ? 'auth-tab-clean-active' : ''}`}
              >
                Sign in
              </button>
              <button
                type="button"
                data-testid="register-tab"
                onClick={() => setIsLogin(false)}
                className={`auth-tab-clean ${!isLogin ? 'auth-tab-clean-active' : ''}`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="auth-label">Full name</label>
                  <input
                    id="name"
                    data-testid="name-input"
                    className="auth-input-clean"
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required={!isLogin}
                  />
                </div>
              )}

              {!isLogin && (
                <div>
                  <label htmlFor="phone" className="auth-label">Phone</label>
                  <input
                    id="phone"
                    data-testid="phone-input"
                    className="auth-input-clean"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="auth-label">Email</label>
                <input
                  id="email"
                  type="email"
                  data-testid="email-input"
                  className="auth-input-clean"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="auth-label !mb-0">Password</label>
                  {isLogin && (
                    <a
                      href="/forgot-password"
                      data-testid="forgot-password-link"
                      className="text-xs font-medium text-white/60 hover:text-white transition-colors"
                    >
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    data-testid="password-input"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input-clean pr-11"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="password-input-toggle-visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 text-white/45 hover:text-white transition-colors"
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
                className="auth-cta-clean mt-3"
              >
                {loading
                  ? 'Please wait…'
                  : (
                    <>
                      <span>{isLogin ? 'Sign in' : 'Create account'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
              </button>
            </form>

            {isLogin && biometricEnabled && biometricEmail && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.08]" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-[#0c0d11] px-3 text-[11px] font-medium text-white/40">
                      or
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={loading}
                  data-testid="biometric-login-button"
                  className="auth-secondary-clean"
                >
                  <Fingerprint className="h-4 w-4" />
                  Sign in with Face ID
                </button>
              </>
            )}

            {/* trust line — single, calm */}
            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-white/40">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Bank-grade encryption · Funds held in escrow</span>
            </div>
          </div>

          {/* footer — extremely calm */}
          <div className="mt-6 flex flex-col items-center gap-3 text-[11px] text-white/35">
            <p>Must be 18+ to use BETZ</p>
            <div className="flex items-center gap-4">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <span className="text-white/15">·</span>
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
              <span className="text-white/15">·</span>
              <a href="/contact" className="hover:text-white transition-colors">Contact</a>
              <span className="text-white/15">·</span>
              <a href="/admin/login" className="hover:text-white transition-colors">Admin</a>
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
