import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';
import PasswordInput from '../components/PasswordInput';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminLoginPage({ onAdminLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API}/admin/login`, { email, password });
      localStorage.setItem('admin_token', res.data.access_token);
      onAdminLogin(res.data.access_token);
      toast.success('Admin login successful');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(to bottom, #18181B, #09090B)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-4">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black font-heading tracking-tighter uppercase text-primary mb-2" data-testid="admin-login-title">
            ADMIN PANEL
          </h1>
          <p className="text-muted-foreground text-base">BETZ Platform Control</p>
        </div>

        <Card className="bg-card border-white/10 shadow-2xl p-8 rounded-2xl" data-testid="admin-login-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                data-testid="admin-email-input"
                type="email"
                placeholder="admin@betz.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input/50 border-transparent focus:border-primary rounded-lg h-12"
              />
            </div>

            <div>
              <Label htmlFor="password">Admin Password</Label>
              <PasswordInput
                id="password"
                data-testid="admin-password-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-input/50 border-transparent focus:border-primary rounded-lg h-12"
              />
            </div>

            <Button
              type="submit"
              data-testid="admin-login-button"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-14 text-lg font-bold uppercase tracking-wide btn-glow"
            >
              {loading ? 'Logging in...' : 'Access Admin Panel'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">Admin access only</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="mt-2 text-primary"
            >
              Back to App
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
