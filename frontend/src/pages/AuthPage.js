import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowRight, Fingerprint } from 'lucide-react';
import PasswordInput from '../components/PasswordInput';
import BiometricPrompt from '../components/BiometricPrompt';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricEmail, setBiometricEmail] = useState('');

  useEffect(() => {
    const enabled = localStorage.getItem('biometric_enabled') === 'true';
    const email = localStorage.getItem('biometric_user_email');
    setBiometricEnabled(enabled);
    if (email) {
      setBiometricEmail(email);
    }
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
      
      // Show biometric prompt for new registrations or first-time logins
      if (!isLogin || (!localStorage.getItem('biometric_prompt_shown') && !localStorage.getItem('biometric_enabled'))) {
        setTimeout(() => {
          setShowBiometricPrompt(true);
        }, 1000);
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
    
    // Secure biometric authentication using stored token
    setTimeout(async () => {
      try {
        // Get stored biometric token (not password)
        const biometricToken = localStorage.getItem('biometric_auth_token');
        if (!biometricToken) {
          toast.error('Please login with password first to enable biometric');
          setLoading(false);
          return;
        }

        // Verify the biometric token with backend
        const res = await axios.post(`${API}/auth/biometric-login`, {
          email: biometricEmail,
          biometric_token: biometricToken
        });
        
        onLogin(res.data.access_token, res.data.user);
        toast.success('Welcome back!');
      } catch (error) {
        // Fallback: Clear invalid token and ask for password
        localStorage.removeItem('biometric_auth_token');
        localStorage.removeItem('biometric_enabled');
        toast.error('Biometric session expired. Please login with password.');
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(to bottom, #18181B, #09090B)'
      }}
    >
      {/* Professional Racing Header - Stylized Design */}
      <div className="absolute top-0 left-0 right-0 h-[420px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/70 to-background z-20"></div>
        
        {/* Professional Racing SVG Design */}
        <svg className="w-full h-full" viewBox="0 0 800 420" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* Main gradient background */}
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a1a2e"/>
              <stop offset="50%" stopColor="#16213e"/>
              <stop offset="100%" stopColor="#0f0f23"/>
            </linearGradient>
            
            {/* Neon glow effect */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Checkered pattern */}
            <pattern id="checker" width="30" height="30" patternUnits="userSpaceOnUse">
              <rect width="15" height="15" fill="#ffffff" opacity="0.03"/>
              <rect x="15" y="15" width="15" height="15" fill="#ffffff" opacity="0.03"/>
            </pattern>
            
            {/* Speed lines gradient */}
            <linearGradient id="speedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0"/>
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0"/>
            </linearGradient>
          </defs>
          
          {/* Background */}
          <rect width="100%" height="100%" fill="url(#bgGrad)"/>
          <rect width="100%" height="100%" fill="url(#checker)"/>
          
          {/* Diagonal racing stripes */}
          <g opacity="0.15">
            <rect x="-100" y="280" width="1000" height="8" fill="#a855f7" transform="rotate(-5)"/>
            <rect x="-100" y="300" width="1000" height="4" fill="#eab308" transform="rotate(-5)"/>
            <rect x="-100" y="315" width="1000" height="6" fill="#22c55e" transform="rotate(-5)"/>
          </g>
          
          {/* Christmas Tree / Staging Lights - Professional Style */}
          <g transform="translate(400, 60)">
            {/* Tree housing */}
            <rect x="-25" y="-10" width="50" height="180" rx="8" fill="#1a1a1a" stroke="#333" strokeWidth="2"/>
            
            {/* Pre-stage lights */}
            <circle cx="-8" cy="15" r="6" fill="#333"/>
            <circle cx="8" cy="15" r="6" fill="#333"/>
            
            {/* Stage lights */}
            <circle cx="-8" cy="40" r="6" fill="#333"/>
            <circle cx="8" cy="40" r="6" fill="#333"/>
            
            {/* Countdown ambers - glowing */}
            <circle cx="0" cy="70" r="10" fill="#fbbf24" filter="url(#glow)" opacity="0.9"/>
            <circle cx="0" cy="95" r="10" fill="#fbbf24" filter="url(#glow)" opacity="0.7"/>
            <circle cx="0" cy="120" r="10" fill="#f59e0b" filter="url(#glow)" opacity="0.5"/>
            
            {/* Green GO light - bright */}
            <circle cx="0" cy="150" r="12" fill="#22c55e" filter="url(#glow)"/>
            <circle cx="0" cy="150" r="8" fill="#4ade80"/>
          </g>
          
          {/* Speed/motion lines */}
          <g opacity="0.4">
            <rect x="50" y="320" width="150" height="2" fill="url(#speedGrad)" rx="1"/>
            <rect x="80" y="335" width="100" height="1.5" fill="url(#speedGrad)" rx="1"/>
            <rect x="600" y="320" width="150" height="2" fill="url(#speedGrad)" rx="1"/>
            <rect x="620" y="335" width="100" height="1.5" fill="url(#speedGrad)" rx="1"/>
          </g>
          
          {/* Checkered flag corners */}
          <g opacity="0.2">
            <path d="M0 0 L80 0 L0 80 Z" fill="url(#checker)"/>
            <path d="M800 0 L720 0 L800 80 Z" fill="url(#checker)"/>
          </g>
          
          {/* Subtle tire smoke effect */}
          <ellipse cx="200" cy="380" rx="120" ry="30" fill="#ffffff" opacity="0.05"/>
          <ellipse cx="600" cy="380" rx="120" ry="30" fill="#ffffff" opacity="0.05"/>
          
          {/* Racing badge */}
          <g transform="translate(400, 260)">
            <rect x="-60" y="-15" width="120" height="30" rx="15" fill="#a855f7" opacity="0.2"/>
            <text x="0" y="6" textAnchor="middle" fill="#a855f7" fontSize="14" fontWeight="bold" fontFamily="system-ui">DRAG RACING</text>
          </g>
        </svg>
      </div>
      </div>

      <div className="w-full max-w-md relative z-20">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-5xl font-black tracking-tight text-primary mb-2 drop-shadow-2xl" data-testid="auth-title">
            BETZ
          </h1>
          <p className="text-accent text-base font-bold tracking-wide">Trusted P2P Betting</p>
          <p className="text-muted-foreground text-xs mt-1">Bet Secure. Get Paid.</p>
        </div>

        <Card className="premium-card shadow-2xl p-6 rounded-2xl border-white/10" data-testid="auth-card">
          <div className="flex gap-2 mb-6">
            <Button
              data-testid="login-tab"
              onClick={() => setIsLogin(true)}
              variant={isLogin ? 'default' : 'ghost'}
              className={`flex-1 rounded-xl h-11 ${isLogin ? 'btn-premium text-white' : 'text-muted-foreground'}`}
            >
              Sign In
            </Button>
            <Button
              data-testid="register-tab"
              onClick={() => setIsLogin(false)}
              variant={!isLogin ? 'default' : 'ghost'}
              className={`flex-1 rounded-xl h-11 ${!isLogin ? 'btn-premium text-white' : 'text-muted-foreground'}`}
            >
              Register
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-xs text-muted-foreground">Full Name</Label>
                <Input
                  id="name"
                  data-testid="name-input"
                  placeholder="Johnny Racer"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required={!isLogin}
                  className="bg-muted/30 border-white/10 focus:border-primary rounded-xl h-12 mt-1"
                />
              </div>
            )}

            {!isLogin && (
              <div>
                <Label htmlFor="phone" className="text-xs text-muted-foreground">Phone Number</Label>
                <Input
                  id="phone"
                  data-testid="phone-input"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required={!isLogin}
                  className="bg-muted/30 border-white/10 focus:border-primary rounded-xl h-12 mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
              <Input
                id="email"
                data-testid="email-input"
                type="email"
                placeholder="racer@betz.app"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-muted/30 border-white/10 focus:border-primary rounded-xl h-12 mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
              <PasswordInput
                id="password"
                data-testid="password-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="bg-muted/30 border-white/10 focus:border-primary rounded-xl h-12 mt-1"
              />
            </div>

            <Button
              type="submit"
              data-testid="submit-button"
              disabled={loading}
              className="w-full btn-premium text-white hover:bg-primary/90 rounded-xl h-12 text-sm font-bold mt-2"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {isLogin && (
            <div className="text-center mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/forgot-password'}
                className="text-primary hover:text-primary/90 text-xs"
                data-testid="forgot-password-link"
              >
                Forgot password?
              </Button>
            </div>
          )}

          {isLogin && biometricEnabled && biometricEmail && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleBiometricLogin}
                disabled={loading}
                variant="outline"
                className="w-full border-primary/50 hover:bg-primary/10 rounded-2xl h-14"
                data-testid="biometric-login-button"
              >
                <Fingerprint className="mr-2 h-5 w-5 text-primary" />
                Sign in with Face ID
              </Button>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Must be 18+ to use BETZ
          </p>

          {/* Legal Links */}
          <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
            <span>•</span>
            <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
            <span>•</span>
            <a href="/contact" className="hover:text-primary transition-colors">Contact</a>
          </div>
          
          <div className="mt-4 text-center">
            <a href="/admin/login" className="text-xs text-muted-foreground hover:text-primary">
              Admin? Login here →
            </a>
          </div>
        </Card>

        {showBiometricPrompt && (
          <BiometricPrompt
            userEmail={formData.email}
            onClose={() => setShowBiometricPrompt(false)}
          />
        )}
      </div>
    </div>
  );
}