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
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(to bottom, #18181B, #09090B)'
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold tracking-tight text-white mb-1" data-testid="auth-title">
            BETZ
          </h1>
          <p className="text-muted-foreground text-sm font-medium">High-Stakes Racing</p>
        </div>

        <Card className="bg-card border-white/10 shadow-2xl p-8 rounded-2xl" data-testid="auth-card">
          <div className="flex gap-2 mb-6">
            <Button
              data-testid="login-tab"
              onClick={() => setIsLogin(true)}
              variant={isLogin ? 'default' : 'ghost'}
              className={`flex-1 rounded-full ${isLogin ? 'bg-primary text-primary-foreground' : ''}`}
            >
              Login
            </Button>
            <Button
              data-testid="register-tab"
              onClick={() => setIsLogin(false)}
              variant={!isLogin ? 'default' : 'ghost'}
              className={`flex-1 rounded-full ${!isLogin ? 'bg-primary text-primary-foreground' : ''}`}
            >
              Register
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="bg-input/50 border-transparent focus:border-primary rounded-lg h-12"
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
                  className="bg-input/50 border-transparent focus:border-primary rounded-lg h-12"
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
                className="bg-input/50 border-transparent focus:border-primary rounded-lg h-12"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                data-testid="password-input"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="bg-input/50 border-transparent focus:border-primary rounded-lg h-12"
              />
            </div>

            <Button
              type="submit"
              data-testid="submit-button"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl h-14 text-base font-semibold btn-glow"
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

          <p className="text-center text-sm text-muted-foreground mt-6">
            Must be 18+ to use BETZ
          </p>
        </Card>
      </div>
    </div>
  );
}