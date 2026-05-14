import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowRight, Fingerprint, Eye, EyeOff, ShieldCheck, Zap } from 'lucide-react';
import BiometricPrompt from '../components/BiometricPrompt';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BG_IMAGE =
  'https://images.unsplash.com/photo-1613713568305-8da2fc04f168?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwyfHxkcmFnJTIwcmFjZSUyMGNhciUyMG5pZ2h0fGVufDB8fHx8MTc3ODcyMTMwN3ww&ixlib=rb-4.1.0&q=85';

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
          alt="Drag race at night"
          className="absolute inset-0 h-full w-full object-cover opacity-80 md:opacity-90"
          style={{ filter: 'contrast(1.1) saturate(1.05)' }}
        />
        {/* dark gradient for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/85 to-[#050505]/30 md:bg-gradient-to-r md:from-[#050505] md:via-[#050505]/70 md:to-transparent" />
        {/* tire-smoke drift */}
        <div className="smoke-trail" style={{ top: '20%' }} />
        <div className="smoke-trail s2" />
        <div className="smoke-trail s3" />
        {/* scan line */}
        <div className="scan-line" />
        {/* faint grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* === TOP MARQUEE — race ticker === */}
      <div className="relative z-10 overflow-hidden border-b border-white/5 bg-black/30 py-2 backdrop-blur-md">
        <div className="betz-marquee flex whitespace-nowrap text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4">
              <span>● Live P2P Betting</span>
              <span className="text-[#00ff41]">● Bet Secure. Get Paid.</span>
              <span>● Trusted Decision Person</span>
              <span>● 10% Punk-Out Penalty</span>
              <span className="text-[#00ff41]">● 18+ Only</span>
              <span>● Verified Wins</span>
              <span>● Fast Cashouts</span>
            </div>
          ))}
        </div>
      </div>

      <div className="speed-strip top-[44px]" />

      {/* === MAIN LAYOUT === */}
      <div className="relative z-10 flex min-h-[calc(100vh-44px)] flex-col md:flex-row md:items-stretch">
        {/* LEFT (mobile: hero on top / desktop: full hero column) */}
        <div className="flex flex-1 flex-col justify-end px-6 pt-10 pb-6 md:justify-center md:px-16 md:pb-0">
          {/* wordmark with green glow */}
          <div className="relative inline-block">
            <div className="auth-glow absolute -inset-10 -z-10" />
            <h1
              data-testid="auth-title"
              className="font-heading text-7xl leading-[0.85] tracking-tight text-white md:text-[120px]"
            >
              BE<span className="text-[#00ff41]">T</span>Z
            </h1>
          </div>

          {/* tagline */}
          <p className="mt-3 font-heading text-base tracking-[0.35em] uppercase text-[#00ff41] md:text-xl">
            Bet Secure. Get Paid.
          </p>

          {/* sub-line + staging lights */}
          <div className="mt-4 flex items-center gap-4 md:mt-6">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md">
              <span className="stage-light h-2 w-2 rounded-full bg-white/10" />
              <span className="stage-light delay-1 h-2 w-2 rounded-full bg-white/10" />
              <span className="stage-light delay-2 h-2 w-2 rounded-full bg-white/10" />
              <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                Staging
              </span>
            </div>
            <div className="hidden items-center gap-1.5 text-xs font-medium text-white/50 md:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-[#00ff41]" />
              <span>Escrowed P2P Wallet</span>
            </div>
          </div>

          {/* desktop trust badges */}
          <div className="mt-8 hidden max-w-md flex-wrap gap-3 md:flex">
            {[
              { icon: ShieldCheck, label: 'Bank-grade encryption' },
              { icon: Zap, label: 'Instant payouts' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white/70 backdrop-blur-md"
              >
                <Icon className="h-3.5 w-3.5 text-[#00ff41]" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT (form card) */}
        <div className="relative flex flex-1 items-end justify-center md:items-center md:justify-end md:px-12 md:py-12">
          <div className="w-full max-w-md md:max-w-[440px]">
            <div
              data-testid="auth-card"
              className="auth-card-shell relative rounded-t-[2rem] px-6 pt-7 pb-8 md:rounded-3xl md:p-9"
            >
              {/* top accent line */}
              <div className="absolute left-1/2 top-0 h-[3px] w-16 -translate-x-1/2 rounded-b-full bg-[#00ff41] shadow-[0_0_12px_#00ff41]" />

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
                        className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00ff41] hover:text-white transition-colors"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 text-white/50 hover:text-[#00ff41] transition-colors"
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
                    <Fingerprint className="h-5 w-5 text-[#00ff41]" />
                    Sign in with Face ID
                  </button>
                </>
              )}

              <p className="mt-7 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
                Must be 18+ to use BETZ
              </p>

              <div className="mt-3 flex justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">
                <a href="/privacy" className="hover:text-[#00ff41] transition-colors">
                  Privacy
                </a>
                <span>•</span>
                <a href="/terms" className="hover:text-[#00ff41] transition-colors">
                  Terms
                </a>
                <span>•</span>
                <a href="/contact" className="hover:text-[#00ff41] transition-colors">
                  Contact
                </a>
              </div>

              <div className="mt-4 text-center">
                <a
                  href="/admin/login"
                  className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/35 hover:text-[#00ff41] transition-colors"
                >
                  Admin? Login here →
                </a>
              </div>
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
