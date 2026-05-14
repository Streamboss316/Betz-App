import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowRight, Fingerprint, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import BiometricPrompt from '../components/BiometricPrompt';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BG_IMAGE =
  'https://images.unsplash.com/photo-1654052329553-acaef54a2b4b?w=1800&q=85&auto=format&fit=crop';

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
      {/* === RESTRAINED BACKGROUND === */}
      <div className="fixed inset-0 z-0">
        <img
          src={BG_IMAGE}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'grayscale(35%) contrast(0.95) brightness(0.55)', opacity: 0.45 }}
        />
        {/* deep dark wash */}
        <div className="absolute inset-0 bg-[#06070a]/80" />
        {/* very subtle purple/gold ambient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, rgba(168,85,247,0.10), transparent 55%), radial-gradient(circle at 50% 100%, rgba(251,191,36,0.06), transparent 55%)',
          }}
        />

        {/* === STAGING TREE — tiny monochrome watermark, far left, ~25% opacity === */}
        <svg
          aria-hidden="true"
          viewBox="0 0 100 360"
          className="pointer-events-none absolute left-4 bottom-8 z-[1] hidden h-[50vh] max-h-[420px] w-auto md:block"
          style={{ opacity: 0.12 }}
        >
          <rect x="48" y="0" width="4" height="360" fill="#ffffff" />
          <circle cx="38" cy="30" r="3" fill="#ffffff" />
          <circle cx="62" cy="30" r="3" fill="#ffffff" />
          <circle cx="38" cy="55" r="3" fill="#ffffff" />
          <circle cx="62" cy="55" r="3" fill="#ffffff" />
          <circle cx="50" cy="105" r="12" fill="#ffffff" />
          <circle cx="50" cy="155" r="12" fill="#ffffff" />
          <circle cx="50" cy="205" r="12" fill="#ffffff" />
          <circle cx="50" cy="265" r="14" fill="#ffffff" />
        </svg>
      </div>

      {/* === HEADER — minimal, top-centered === */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-16 pb-6 md:pt-20 md:pb-8">
        <h1
          data-testid="auth-title"
          className="font-heading text-5xl tracking-[0.02em] md:text-6xl"
          style={{ letterSpacing: '0.04em' }}
        >
          <span className="brand-text">BETZ</span>
        </h1>
        <p className="mt-2 text-[11px] font-bold tracking-[0.35em] uppercase text-[#22c55e]">
          Bet Secure. Get Paid.
        </p>
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
