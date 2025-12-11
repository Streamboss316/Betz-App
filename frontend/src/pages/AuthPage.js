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
    
    // Simulate biometric authentication
    setTimeout(async () => {
      try {
        // Get stored credentials
        const password = localStorage.getItem('biometric_password_hash');
        if (!password) {
          toast.error('Please login with password first');
          setLoading(false);
          return;
        }

        const res = await axios.post(`${API}/auth/login`, {
          email: biometricEmail,
          password: password
        });
        
        onLogin(res.data.access_token, res.data.user);
        toast.success('Welcome back!');
      } catch (error) {
        toast.error('Biometric authentication failed');
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
      {/* Racing Header Background - Complete Drag Racing Scene with Staging Lights */}
      <div className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background z-10"></div>
        <img 
          src="https://customer-assets.emergentagent.com/job_betz-messaging-app/artifacts/gim9lxs9_Snip20251208_7.png"
          alt="Drag racing with starting tree, gauges, checkered flags and RACING emblem"
          className="w-full h-full object-contain opacity-65"
        />
      </div>

      <div className="w-full max-w-md relative z-20">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-6xl font-bold tracking-tight text-white mb-2 drop-shadow-2xl" data-testid="auth-title">
            BETZ
          </h1>
          <p className="text-muted-foreground text-sm font-medium">High-Stakes Racing</p>
          <p className="text-xs text-accent mt-2">USER LOGIN</p>
        </div>

        <Card className="premium-card shadow-2xl p-8 rounded-2xl" data-testid="auth-card">
          <div className="flex gap-2 mb-6">
            <Button
              data-testid="login-tab"
              onClick={() => setIsLogin(true)}
              variant={isLogin ? 'default' : 'ghost'}
              className={`flex-1 rounded-full ${isLogin ? 'btn-premium text-white' : ''}`}
            >
              Login
            </Button>
            <Button
              data-testid="register-tab"
              onClick={() => setIsLogin(false)}
              variant={!isLogin ? 'default' : 'ghost'}
              className={`flex-1 rounded-full ${!isLogin ? 'btn-premium text-white' : ''}`}
            >
              Register
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  data-testid="name-input"
                  placeholder="Johnny Racer"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required={!isLogin}
                  className="bg-input border-border focus:border-primary rounded-lg h-12"
                />
              </div>
            )}

            {!isLogin && (
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  data-testid="phone-input"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required={!isLogin}
                  className="bg-input border-border focus:border-primary rounded-lg h-12"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                data-testid="email-input"
                type="email"
                placeholder="racer@betz.app"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-input border-border focus:border-primary rounded-lg h-12"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                data-testid="password-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="bg-input border-border focus:border-primary rounded-lg h-12"
              />
            </div>

            <Button
              type="submit"
              data-testid="submit-button"
              disabled={loading}
              className="w-full btn-premium text-white hover:bg-primary/90 rounded-2xl h-14 text-base font-semibold btn-premium"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>

          {isLogin && (
            <div className="text-center mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/forgot-password'}
                className="text-primary hover:text-primary/90"
                data-testid="forgot-password-link"
              >
                Forgot Password?
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