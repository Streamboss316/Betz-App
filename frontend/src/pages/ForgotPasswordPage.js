import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Key, Mail } from 'lucide-react';
import PasswordInput from '../components/PasswordInput';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [betzId, setBetzId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API}/auth/forgot-password`, { email });
      toast.success(res.data.message);
      if (res.data.betz_id_hint) {
        toast.info(`Your Betz ID starts with: ${res.data.betz_id_hint}`);
      }
      setStep(2);
    } catch (error) {
      toast.error('Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API}/auth/reset-password`, {
        email,
        betz_id: betzId,
        new_password: newPassword
      });
      toast.success('Password reset successfully! Please login.');
      navigate('/auth');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid email or Betz ID');
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
            <Key className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-black font-heading tracking-tighter uppercase text-primary mb-2" data-testid="forgot-password-title">
            Reset Password
          </h1>
          <p className="text-muted-foreground text-base">
            {step === 1 ? 'Recover your account' : 'Enter new password'}
          </p>
        </div>

        <Card className="bg-card border-white/10 shadow-2xl p-8 rounded-2xl" data-testid="forgot-password-card">
          {step === 1 ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    data-testid="email-input"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-input/50 border-transparent focus:border-primary rounded-lg h-12"
                  />
                </div>
              </div>

              <Button
                type="submit"
                data-testid="send-reset-button"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-14 text-lg font-bold uppercase tracking-wide btn-glow"
              >
                {loading ? 'Processing...' : 'Send Recovery Info'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="betz-id">Your Betz ID</Label>
                <Input
                  id="betz-id"
                  data-testid="betz-id-input"
                  placeholder="BETZ12345678"
                  value={betzId}
                  onChange={(e) => setBetzId(e.target.value.toUpperCase())}
                  required
                  className="bg-input/50 border-transparent focus:border-primary rounded-lg h-12 font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your full Betz ID to verify identity
                </p>
              </div>

              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  data-testid="new-password-input"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="bg-input/50 border-transparent focus:border-primary rounded-lg h-12"
                />
              </div>

              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  data-testid="confirm-password-input"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-input/50 border-transparent focus:border-primary rounded-lg h-12"
                />
              </div>

              <Button
                type="submit"
                data-testid="reset-password-button"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-14 text-lg font-bold uppercase tracking-wide btn-glow"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center space-y-2">
            {step === 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                className="text-primary"
              >
                Back to Email Entry
              </Button>
            )}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/auth')}
                className="text-muted-foreground hover:text-primary"
                data-testid="back-to-login"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Button>
            </div>
          </div>

          <div className="mt-6 p-3 bg-accent/10 rounded-lg border border-accent/20 text-sm">
            <p className="text-accent font-semibold mb-1">Demo Mode</p>
            <p className="text-muted-foreground text-xs">
              Use any demo account email (e.g., demo@betz.app) and your Betz ID to reset password
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
