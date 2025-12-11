import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Users, DollarSign, TrendingUp, Activity, Settings, LogOut, Shield, Eye, TestTube } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const res = await axios.get(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load stats');
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    onLogout();
    toast.success('Logged out');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-2xl font-heading">Processing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-black font-heading tracking-tighter uppercase text-primary" data-testid="admin-title">BETZ ADMIN</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-destructive hover:text-destructive/90"
          data-testid="admin-logout-button"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-white/10 p-6 rounded-2xl" data-testid="total-users-card">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-10 w-10 text-primary" />
              <span className="text-3xl font-black font-mono">{stats?.total_users || 0}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </Card>

          <Card className="bg-gradient-to-br from-accent/20 to-accent/10 border-white/10 p-6 rounded-2xl" data-testid="total-bets-card">
            <div className="flex items-center justify-between mb-4">
              <Activity className="h-10 w-10 text-accent" />
              <span className="text-3xl font-black font-mono">{stats?.total_bets || 0}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Bets</p>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/20 to-secondary/10 border-white/10 p-6 rounded-2xl" data-testid="active-bets-card">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-10 w-10 text-secondary" />
              <span className="text-3xl font-black font-mono">{stats?.active_bets || 0}</span>
            </div>
            <p className="text-sm text-muted-foreground">Active Bets</p>
          </Card>

          <Card className="bg-gradient-to-br from-primary/30 to-secondary/30 border-white/10 p-6 rounded-2xl col-span-1 md:col-span-2 lg:col-span-3" data-testid="revenue-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Platform Revenue (3% fees)</p>
                <p className="text-5xl font-black font-mono text-primary">
                  ${stats?.total_revenue?.toFixed(2) || '0.00'}
                </p>
              </div>
              <DollarSign className="h-16 w-16 text-primary" />
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
              <div>
                <p className="text-muted-foreground">Total Deposits</p>
                <p className="font-mono text-lg">${stats?.total_deposits?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Completed Bets</p>
                <p className="font-mono text-lg">{stats?.completed_bets || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Link to="/admin/users">
            <Card className="premium-card p-6 rounded-xl hover:border-primary/50 transition-all cursor-pointer" data-testid="manage-users-link">
              <Users className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold text-lg">Manage Users</h3>
              <p className="text-sm text-muted-foreground">View, edit, suspend users</p>
            </Card>
          </Link>

          <Link to="/admin/bets">
            <Card className="premium-card p-6 rounded-xl hover:border-primary/50 transition-all cursor-pointer" data-testid="manage-bets-link">
              <Activity className="h-8 w-8 text-accent mb-3" />
              <h3 className="font-bold text-lg">Manage Bets</h3>
              <p className="text-sm text-muted-foreground">Monitor and control bets</p>
            </Card>
          </Link>

          <Link to="/admin/revenue">
            <Card className="premium-card p-6 rounded-xl hover:border-primary/50 transition-all cursor-pointer" data-testid="view-revenue-link">
              <DollarSign className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold text-lg">Revenue & Fees</h3>
              <p className="text-sm text-muted-foreground">Platform earnings</p>
            </Card>
          </Link>

          <Link to="/admin/settings">
            <Card className="premium-card p-6 rounded-xl hover:border-primary/50 transition-all cursor-pointer" data-testid="settings-link">
              <Settings className="h-8 w-8 text-secondary mb-3" />
              <h3 className="font-bold text-lg">Settings</h3>
              <p className="text-sm text-muted-foreground">Bank & payment setup</p>
            </Card>
          </Link>

          <Link to="/admin/dp">
            <Card className="premium-card p-6 rounded-xl hover:border-primary/50 transition-all cursor-pointer" data-testid="dp-monitor-link">
              <Eye className="h-8 w-8 text-accent mb-3" />
              <h3 className="font-bold text-lg">DP Monitor</h3>
              <p className="text-sm text-muted-foreground">View Digital Persona decisions</p>
            </Card>
          </Link>

          <Link to="/admin/demo">
            <Card className="premium-card p-6 rounded-xl hover:border-primary/50 transition-all cursor-pointer" data-testid="demo-mode-link">
              <TestTube className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold text-lg">Demo Mode</h3>
              <p className="text-sm text-muted-foreground">Test as any user</p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
